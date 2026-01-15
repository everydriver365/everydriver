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

// RFC 1738 encoding: spaces become '+', other special chars are percent-encoded
function rfc1738Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

// Cardstream requires SHA-512 signature with RFC 1738 encoded query string
async function createSignature(data: Record<string, string>, secretKey: string): Promise<string> {
  const sortedKeys = Object.keys(data).sort();

  // Build RFC 1738 encoded query string (spaces as +)
  const queryString = sortedKeys
    .map(key => `${rfc1738Encode(key)}=${rfc1738Encode(data[key] ?? '')}`)
    .join('&');

  // Normalize line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
  const normalizedQueryString = queryString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A');

  const signatureInput = normalizedQueryString + secretKey;

  console.log("Signature query string (first 200 chars):", normalizedQueryString.substring(0, 200));

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
    // Cardstream credentials
    const merchantAlias = Deno.env.get("ELAVON_MERCHANT_ALIAS")?.trim() ?? "";
    const secretKey = Deno.env.get("ELAVON_SECRET_KEY")?.trim() ?? "";

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

    // Cardstream uses amount in minor units (pence)
    const amountInMinorUnits = Math.round(amount * 100);
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Cardstream HPP form fields
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
      formResponsive: "Y",
    };

    // Add optional customer details
    if (customerEmail) formFields.customerEmail = customerEmail;
    if (customerName) formFields.customerName = customerName;

    console.log("Cardstream form fields (pre-signature):", JSON.stringify(formFields, null, 2));

    // Generate SHA-512 signature
    const signature = await createSignature(formFields, secretKey);
    formFields.signature = signature;

    console.log("Generated signature:", signature.substring(0, 32) + "...");

    // Cardstream HPP endpoint
    const formAction = "https://gateway.cardstream.com/hosted/";

    // Build redirect URL for legacy GET method (fallback)
    const params = new URLSearchParams();
    for (const key of Object.keys(formFields).sort()) {
      params.append(key, formFields[key]);
    }
    const legacyRedirectUrl = `${formAction}?${params.toString()}`;

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
