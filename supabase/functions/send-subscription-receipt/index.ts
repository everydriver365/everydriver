import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { instructor_id, amount, plan_name, period_start, period_end, payment_reference, payment_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: instructor } = await supabase
      .from("instructors").select("name, email").eq("id", instructor_id).single();
    if (!instructor?.email) throw new Error("Instructor email not found");

    const formattedAmount = `£${(amount / 100).toFixed(2)}`;
    const formattedStart = period_start ? new Date(period_start).toLocaleDateString("en-GB") : "N/A";
    const formattedEnd = period_end ? new Date(period_end).toLocaleDateString("en-GB") : "N/A";
    const receiptDate = new Date().toLocaleDateString("en-GB");

    const result = await sendBrandedEmail({
      to: instructor.email,
      subject: `Payment Receipt - ${plan_name} Plan - ${receiptDate}`,
      heading: "Subscription payment receipt",
      intro: `Hi ${instructor.name || "there"}, thank you for your subscription payment. Here's your receipt.`,
      details: [
        { label: "Plan", value: plan_name },
        { label: "Amount", value: formattedAmount },
        { label: "Date", value: receiptDate },
        { label: "Period", value: `${formattedStart} – ${formattedEnd}` },
        { label: "Reference", value: payment_reference || payment_id || "N/A" },
        { label: "Method", value: "Direct Debit" },
      ],
      footerNote: "This payment was collected via Direct Debit and is protected by the Direct Debit Guarantee. Questions? hello@everydriver.co.uk",
      idempotencyKey: `sub-receipt-${payment_id || payment_reference || receiptDate}`,
    }, supabase);

    if (result.enqueued === 0) throw new Error(`Failed to send receipt: ${result.errors.join("; ")}`);

    if (payment_id) {
      await supabase.from("subscription_payments")
        .update({ receipt_sent: true })
        .eq("gocardless_payment_id", payment_id);
    }

    return new Response(JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
