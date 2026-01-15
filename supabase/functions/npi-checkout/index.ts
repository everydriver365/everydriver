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
  description: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
}

// Create signature following NPI documentation:
// 1. Sort fields alphabetically by key
// 2. Build URL-encoded query string
// 3. Normalize line endings
// 4. Append secret key
// 5. Hash with SHA-512
async function createNPISignature(data: Record<string, string>, secretKey: string): Promise<string> {
  // Sort fields alphabetically by key
  const sortedKeys = Object.keys(data).sort();
  
  // Build URL-encoded query string (matching PHP http_build_query)
  const queryParts: string[] = [];
  for (const key of sortedKeys) {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(data[key] || '');
    queryParts.push(`${encodedKey}=${encodedValue}`);
  }
  let queryString = queryParts.join('&');
  
  // Normalize line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
  queryString = queryString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A');
  
  // Append secret key
  const signatureInput = queryString + secretKey;
  
  console.log("Signature input (without secret):", queryString);
  
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
      redirectURL: returnUrl,
    };

    // Add optional fields only if they have values
    if (customerEmail) {
      requestData.customerEmail = customerEmail;
    }
    if (customerName) {
      requestData.customerName = customerName;
    }

    // Calculate signature from all fields
    const signature = await createNPISignature(requestData, merchantSecret);
    
    console.log("Generated signature:", signature.substring(0, 32) + "...");

    // Add signature to the request
    requestData.signature = signature;

    // NPI Payments UK HPP endpoint
    const npiBaseUrl = "https://payments.npigateway.ie/hosted/";

    // Build the HPP URL with all parameters
    const hppParams = new URLSearchParams(requestData);
    const redirectUrl = `${npiBaseUrl}?${hppParams.toString()}`;

    console.log("NPI HPP redirect URL generated for order:", orderReference);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: redirectUrl,
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
