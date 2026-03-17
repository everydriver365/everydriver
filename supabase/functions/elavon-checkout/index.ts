import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCardstreamSignature } from "../_shared/cardstream_signature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ElavonCheckoutRequest {
  amount: number;
  currency?: string;
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostcode?: string;
  description?: string;
  returnUrl: string;
  cancelUrl?: string;
  instructorId?: string;
  pupilId?: string;
  formResponsive?: boolean;
  merchantName?: string;
  type?: string; // "balance" for pupil balance top-ups
}

function splitCustomerAddress(address?: string) {
  if (!address?.trim()) return null;

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    line1: parts[0] ?? address.trim(),
    line2: parts[1] ?? "",
    town: parts[2] ?? "",
    county: parts[3] ?? "",
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use NPI (Cardstream) credentials — these are the working HPP credentials
    const merchantId = Deno.env.get("NPI_MERCHANT_ID")?.trim() ?? "";
    const secretKey = Deno.env.get("NPI_MERCHANT_SECRET")?.trim() ?? "";

    console.log("[elavon-checkout] Using NPI credentials, merchantId length:", merchantId.length);

    if (!merchantId || !secretKey) {
      console.error("Elavon credentials not configured");
      return new Response(
        JSON.stringify({ error: "Elavon Payments not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ElavonCheckoutRequest = await req.json();
    console.log("Elavon Checkout request:", {
      amount: body.amount,
      orderReference: body.orderReference,
      customerEmail: body.customerEmail,
    });

    const { amount, orderReference, returnUrl } = body;

    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, orderReference, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInPence = Math.round(amount * 100);
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Record payment intent for tracking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    await supabase.from("payment_intents").insert({
      order_ref: orderReference,
      pupil_id: body.pupilId ?? null,
      instructor_id: body.instructorId ?? null,
      amount_pence: amountInPence,
      currency_code: "826",
      status: "pending",
      transaction_unique: transactionUnique,
      provider: "elavon",
    });

    // Build callback URL via payment-callback edge function
    // Pass the caller's origin so payment-callback redirects back to the correct domain
    const callerOrigin = encodeURIComponent(new URL(returnUrl).origin);
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback?provider=elavon&pupilId=${body.pupilId || ""}&ref=${orderReference}${body.type === "balance" ? "&type=balance" : ""}&origin=${callerOrigin}`;

    // Build request data
    const requestData: Record<string, string> = {
      merchantID: merchantId,
      action: "SALE",
      type: "1",
      countryCode: "826",
      currencyCode: "826",
      amount: amountInPence.toString(),
      orderRef: orderReference,
      transactionUnique: transactionUnique,
      redirectURL: callbackUrl,
      formResponsive: body.formResponsive !== false ? "Y" : "N",
    };

    if (body.customerEmail) requestData.customerEmail = body.customerEmail;
    if (body.customerName) requestData.customerName = body.customerName;
    if (body.customerPhone) requestData.customerPhone = body.customerPhone;
    if (body.customerAddress) {
      const structuredAddress = splitCustomerAddress(body.customerAddress);
      console.log("[elavon-checkout] Structured address:", JSON.stringify(structuredAddress));
      requestData.customerAddress1 = structuredAddress?.line1 ?? body.customerAddress;
      if (structuredAddress?.line2) requestData.customerAddress2 = structuredAddress.line2;
      if (structuredAddress?.town) requestData.customerCity = structuredAddress.town;
      if (structuredAddress?.county) requestData.customerCounty = structuredAddress.county;
    }
    if (body.customerPostcode) {
      requestData.customerPostcode = body.customerPostcode;
      requestData.customerCountryCode = "826";
    }
    if (body.merchantName) requestData.merchantName = body.merchantName;

    // Use shared signature helper
    const signature = await createCardstreamSignature(requestData, secretKey);
    requestData.signature = signature;

    const gatewayUrl = "https://gateway.cardstream.com/hosted/";

    // Log all non-sensitive fields for debugging (exclude signature)
    const debugFields = { ...requestData };
    delete debugFields.signature;
    console.log("[elavon-checkout] HPP form fields (excl. signature):", JSON.stringify(debugFields));
    console.log("[elavon-checkout] Signature length:", requestData.signature?.length);

    return new Response(
      JSON.stringify({
        success: true,
        gatewayUrl,
        formData: requestData,
        // Legacy compat fields
        formAction: gatewayUrl,
        formFields: requestData,
        orderReference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Elavon Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create Elavon checkout session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
