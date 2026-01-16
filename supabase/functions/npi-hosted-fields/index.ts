import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HostedFieldsRequest {
  amount: number;
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl: string;
  instructorId?: string;
  pupilId?: string;
}

// Create signature following NPI/Cardstream documentation
async function createSignature(data: Record<string, string>, secretKey: string): Promise<string> {
  const sortedKeys = Object.keys(data).sort();
  
  const queryParts: string[] = [];
  for (const key of sortedKeys) {
    const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
    const encodedValue = encodeURIComponent(data[key] || '').replace(/%20/g, '+');
    queryParts.push(`${encodedKey}=${encodedValue}`);
  }
  let queryString = queryParts.join('&');
  
  queryString = queryString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A');
  
  const signatureInput = queryString + secretKey;
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureInput);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("NPI_MERCHANT_ID");
    const merchantSecret = Deno.env.get("NPI_MERCHANT_SECRET");

    if (!merchantId || !merchantSecret) {
      console.error("NPI credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: HostedFieldsRequest = await req.json();
    console.log("Hosted Fields request:", { 
      amount: body.amount, 
      orderReference: body.orderReference 
    });

    const { amount, orderReference, customerEmail, customerName, returnUrl } = body;

    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInPence = Math.round(amount * 100);
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback?provider=npi&pupilId=${body.pupilId || ""}&ref=${orderReference}`;

    // Build hosted fields configuration
    const hostedFieldsData: Record<string, string> = {
      merchantID: merchantId,
      action: "SALE",
      type: "1",
      countryCode: "826",
      currencyCode: "826",
      amount: amountInPence.toString(),
      orderRef: orderReference,
      transactionUnique: transactionUnique,
      redirectURL: callbackUrl,
      // Hosted Fields specific settings
      hostedModal: "Y",
    };

    if (customerEmail) hostedFieldsData.customerEmail = customerEmail;
    if (customerName) hostedFieldsData.customerName = customerName;

    const signature = await createSignature(hostedFieldsData, merchantSecret);
    hostedFieldsData.signature = signature;

    console.log("Hosted Fields config generated for:", orderReference);

    // Return hosted fields configuration
    // The frontend will use the Cardstream Hosted Fields JS SDK
    return new Response(
      JSON.stringify({
        success: true,
        merchantId: merchantId,
        transactionUnique: transactionUnique,
        orderReference: orderReference,
        amount: amountInPence,
        signature: signature,
        formData: hostedFieldsData,
        // Cardstream Hosted Fields JS SDK URL
        sdkUrl: "https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hosted Fields error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
