import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NPICheckoutRequest {
  amount: number;
  currency: string;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostcode?: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
  // HPP customization options
  useHostedFields?: boolean;
  formResponsive?: boolean;
  merchantLogo?: string;
  merchantName?: string;
}

// Create signature following NPI/Cardstream documentation exactly as PHP example:
// 1. Sort fields alphabetically by key (ksort)
// 2. Build URL-encoded query string (http_build_query style)
// 3. Normalize line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
// 4. Append secret key directly (no separator)
// 5. Hash with SHA-512
async function createNPISignature(data: Record<string, string>, secretKey: string): Promise<string> {
  // Sort fields alphabetically by key (matching PHP ksort)
  const sortedKeys = Object.keys(data).sort();
  
  // Build URL-encoded query string matching PHP http_build_query
  // PHP's http_build_query uses RFC 1738 encoding where spaces become +
  const queryParts: string[] = [];
  for (const key of sortedKeys) {
    const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
    const encodedValue = encodeURIComponent(data[key] || '').replace(/%20/g, '+');
    queryParts.push(`${encodedKey}=${encodedValue}`);
  }
  let queryString = queryParts.join('&');
  
  // Normalise all line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
  queryString = queryString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A');
  
  // Hash the signature string and the key together (key appended directly)
  const signatureInput = queryString + secretKey;
  
  console.log("Signature query string:", queryString.substring(0, 200) + "...");
  
  // Hash with SHA-512
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureInput);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("NPI_MERCHANT_ID");
    const merchantSecret = Deno.env.get("NPI_MERCHANT_SECRET");

    if (!merchantId || !merchantSecret) {
      console.error("NPI credentials not configured");
      return new Response(
        JSON.stringify({ error: "NPI Payments not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: NPICheckoutRequest = await req.json();
    console.log("NPI Checkout request:", { 
      amount: body.amount, 
      orderReference: body.orderReference,
      customerEmail: body.customerEmail 
    });

    const {
      amount,
      orderReference,
      customerEmail,
      customerName,
      returnUrl,
    } = body;

    // Validate required fields
    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, orderReference, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NPI Payments UK HPP expects amount in pence/cents
    const amountInPence = Math.round(amount * 100);

    // Generate unique transaction ID
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build callback URL that goes through our payment-callback function
    // This handles NPI's POST response and redirects to confirmation page
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback?provider=npi&pupilId=${body.pupilId || ""}&ref=${orderReference}`;

    // Build the request data object (signature is calculated from all fields except signature itself)
    const requestData: Record<string, string> = {
      merchantID: merchantId,
      action: "SALE",
      type: "1",
      countryCode: "826", // UK
      currencyCode: "826", // GBP
      amount: amountInPence.toString(),
      orderRef: orderReference,
      transactionUnique: transactionUnique,
      redirectURL: callbackUrl,
      // Enable responsive mobile-friendly form (V2)
      formResponsive: body.formResponsive !== false ? "Y" : "N",
    };

    // Add optional fields only if they have values
    if (customerEmail) {
      requestData.customerEmail = customerEmail;
    }
    if (customerName) {
      requestData.customerName = customerName;
    }
    
    // Add phone and address for pre-filling HPP
    if (body.customerPhone) {
      requestData.customerPhone = body.customerPhone;
    }
    if (body.customerAddress) {
      requestData.customerAddress1 = body.customerAddress;
    }
    if (body.customerPostcode) {
      requestData.customerPostcode = body.customerPostcode;
      requestData.customerCountryCode = "826"; // UK
    }
    
    // Add merchant branding if provided
    if (body.merchantName) {
      requestData.merchantName = body.merchantName;
    }

    // Calculate signature from all fields
    const signature = await createNPISignature(requestData, merchantSecret);
    
    console.log("Generated signature:", signature.substring(0, 32) + "...");

    // Add signature to the request
    requestData.signature = signature;

    // NPI Payments HPP gateway URL
    const gatewayUrl = "https://gateway.cardstream.com/hosted/";

    console.log("NPI HPP form data generated for order:", orderReference);
    console.log("Gateway URL:", gatewayUrl);
    console.log("Form fields count:", Object.keys(requestData).length);

    // Return form data for frontend to POST submit (not a redirect URL)
    return new Response(
      JSON.stringify({
        success: true,
        gatewayUrl: gatewayUrl,
        formData: requestData,
        orderReference: orderReference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("NPI Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create NPI checkout session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
