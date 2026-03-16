import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // enforce GBP-only for now
    const amountPence = Math.round(body.amount * 100);
    const orderRef = `ED-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const merchantId = Deno.env.get("NPI_MERCHANT_ID") || "";
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

    return new Response(
      JSON.stringify({
        success: true,
        orderRef,
        transactionUnique,
        amountPence,
        currencyCode: "826",
        merchantId, // Return merchant ID for client-side tokenization
        hostedFieldsScriptUrl,
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
