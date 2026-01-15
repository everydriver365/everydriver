import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ElavonCheckoutRequest {
  amount: number;
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
}

// Create signature following Cardstream documentation:
// 1. Sort fields alphabetically by key
// 2. Build URL-encoded query string
// 3. Normalize line endings
// 4. Append secret key
// 5. Hash with SHA-512
async function createSignature(data: Record<string, string>, secretKey: string): Promise<string> {
  // Sort fields alphabetically by key
  const sortedKeys = Object.keys(data).sort();

  // Build query string using application/x-www-form-urlencoded rules
  // (PHP http_build_query() default RFC1738: spaces become '+')
  const params = new URLSearchParams();
  for (const key of sortedKeys) {
    params.append(key, data[key] ?? "");
  }

  let queryString = params.toString();

  // Normalize line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
  queryString = queryString
    .replace(/%0D%0A/g, "%0A")
    .replace(/%0A%0D/g, "%0A")
    .replace(/%0D/g, "%0A");

  // Append secret key
  const signatureInput = queryString + secretKey;

  console.log("Signature input (without secret):", queryString);

  // Hash with SHA-512
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureInput);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Cardstream credentials from environment
    // These are stored as "ELAVON_" but are actually Cardstream credentials
    const merchantAlias = Deno.env.get("ELAVON_MERCHANT_ALIAS");
    const secretKey = Deno.env.get("ELAVON_SECRET_KEY");

    if (!merchantAlias || !secretKey) {
      console.error("Missing Cardstream credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ElavonCheckoutRequest = await req.json();
    console.log("Cardstream checkout request received:", {
      amount: body.amount,
      orderReference: body.orderReference,
      customerEmail: body.customerEmail,
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

    // Amount in pence/cents
    const amountInPence = Math.round(amount * 100);

    // Generate unique transaction ID
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build the request data object (signature is calculated from all fields except signature itself)
    const requestData: Record<string, string> = {
      merchantID: merchantAlias,
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
    const signature = await createSignature(requestData, secretKey);
    
    console.log("Generated signature:", signature.substring(0, 32) + "...");

    // Add signature to the request
    requestData.signature = signature;

    // Cardstream HPP endpoint (same gateway as NPI)
    const hppBaseUrl = "https://gateway.cardstream.com/hosted/";

    // Build the HPP URL with all parameters
    const hppParams = new URLSearchParams(requestData);
    const redirectUrl = `${hppBaseUrl}?${hppParams.toString()}`;

    console.log("Cardstream HPP redirect URL generated for order:", orderReference);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: redirectUrl,
        transactionId: transactionUnique,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cardstream checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Failed to process checkout",
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
