import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCardstreamSignature } from "../_shared/cardstream_signature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateIntentRequest {
  pupilId?: string;
  instructorId?: string;
  amount: number; // pounds
  currency?: "GBP";
  customerName?: string;
  customerEmail?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: CreateIntentRequest = await req.json();
    if (!body.amount || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountPence = Math.round(body.amount * 100);
    const orderRef = `ED-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const merchantId = Deno.env.get("NPI_MERCHANT_ID") || "";
    const merchantSecret = Deno.env.get("NPI_MERCHANT_SECRET") || "";
    const directUrl =
      Deno.env.get("CARDSTREAM_DIRECT_URL") ||
      Deno.env.get("NPI_DIRECT_URL") ||
      "https://gateway.cardstream.com/direct/";
    const gatewayOrigin = new URL(directUrl).origin;
    const hostedFieldsScriptUrl = `${gatewayOrigin}/sdk/web/v1/js/hostedfields.min.js`;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase.from("payment_intents").insert({
      order_ref: orderRef,
      pupil_id: body.pupilId ?? null,
      instructor_id: body.instructorId ?? null,
      amount_pence: amountPence,
      currency_code: "826",
      status: "pending",
      transaction_unique: transactionUnique,
      provider: "elavon",
    });

    if (error) throw error;

    // Build the redirectURL for post-3DS callback
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback?provider=elavon&pupilId=${body.pupilId || ""}&ref=${orderRef}&origin=${encodeURIComponent(typeof Deno !== "undefined" ? (Deno.env.get("SITE_URL") || "https://everydriver.lovable.app") : "https://everydriver.lovable.app")}`;

    // Build signed form fields for Hosted Fields form submission mode
    // These fields will be embedded as hidden inputs in the client form.
    // The SDK will POST them along with the card data directly to the gateway.
    const formFields: Record<string, string> = {
      merchantID: merchantId,
      action: "SALE",
      type: "1",
      countryCode: "826",
      currencyCode: "826",
      amount: String(amountPence),
      orderRef,
      transactionUnique,
      redirectURL: callbackUrl,
    };

    if (body.customerName) formFields.customerName = body.customerName;
    if (body.customerEmail) formFields.customerEmail = body.customerEmail;
    if ((body as any).customerAddress) formFields.customerAddress1 = (body as any).customerAddress;
    if ((body as any).customerPostcode) {
      formFields.customerPostcode = (body as any).customerPostcode;
      formFields.customerCountryCode = "826";
    }

    // Sign ALL form fields — gateway verifies signature over every field it receives
    console.log("[payment-intent-create] Signing fields:", Object.keys(formFields).sort().join(", "));
    formFields.signature = await createCardstreamSignature(formFields, merchantSecret);
    console.log("[payment-intent-create] All form field keys:", Object.keys(formFields).sort().join(", "));

    return new Response(
      JSON.stringify({
        success: true,
        orderRef,
        transactionUnique,
        amountPence,
        currencyCode: "826",
        merchantId,
        hostedFieldsScriptUrl,
        signedFormFields: formFields,
        gatewayUrl: directUrl,
        applePay: { supported: true },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
