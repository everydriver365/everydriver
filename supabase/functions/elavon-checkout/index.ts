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

// Cardstream expects application/x-www-form-urlencoded (RFC1738) name/value pairs.
// We MUST build the signature string using the exact same encoding rules
// as the data that will be submitted (spaces become '+').
async function createSignature(data: Record<string, string>, secretKey: string): Promise<string> {
  const sortedKeys = Object.keys(data).sort();

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

  const signatureInput = queryString + secretKey;

  console.log("Signature query string:", queryString);

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureInput);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantAliasRaw = Deno.env.get("ELAVON_MERCHANT_ALIAS") ?? "";
    const secretKeyRaw = Deno.env.get("ELAVON_SECRET_KEY") ?? "";

    const merchantAlias = merchantAliasRaw.trim();
    const secretKey = secretKeyRaw.trim();

    if (!merchantAlias || !secretKey) {
      console.error("Missing Cardstream credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ElavonCheckoutRequest = await req.json();
    console.log("Cardstream checkout request:", {
      amount: body.amount,
      orderReference: body.orderReference,
      customerEmail: body.customerEmail,
    });

    const { amount, orderReference, customerEmail, customerName, returnUrl } = body;

    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, orderReference, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInMinorUnits = Math.round(amount * 100);
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // NOTE: Some Cardstream setups reject GET querystring submissions and require POST.
    // We'll return formAction + formFields so the frontend can POST as x-www-form-urlencoded.
    const formFields: Record<string, string> = {
      merchantID: merchantAlias,
      action: "SALE",
      type: "1",
      countryCode: "826",
      currencyCode: "826",
      amount: amountInMinorUnits.toString(),
      orderRef: orderReference,
      transactionUnique,
      redirectURL: returnUrl,
    };

    if (customerEmail) formFields.customerEmail = customerEmail;
    if (customerName) formFields.customerName = customerName;

    console.log("Request fields (pre-signature):", JSON.stringify(formFields, null, 2));

    const signature = await createSignature(formFields, secretKey);
    formFields.signature = signature;

    // Cardstream HPP endpoint
    const formAction = "https://gateway.cardstream.com/hosted/";

    // Keep legacy GET redirect for debugging/fallback.
    const legacyRedirectUrl = `${formAction}?${new URLSearchParams(formFields).toString()}`;

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transactionUnique,
        formAction,
        formFields,
        redirectUrl: legacyRedirectUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cardstream checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to process checkout", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
