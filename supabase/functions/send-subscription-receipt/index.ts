import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { instructor_id, amount, plan_name, period_start, period_end, payment_reference, payment_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get instructor email
    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, email")
      .eq("id", instructor_id)
      .single();

    if (!instructor?.email) {
      throw new Error("Instructor email not found");
    }

    const formattedAmount = `£${(amount / 100).toFixed(2)}`;
    const formattedStart = period_start ? new Date(period_start).toLocaleDateString("en-GB") : "N/A";
    const formattedEnd = period_end ? new Date(period_end).toLocaleDateString("en-GB") : "N/A";
    const receiptDate = new Date().toLocaleDateString("en-GB");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Payment Receipt</h1>
          <p style="color: #666; font-size: 14px; margin: 8px 0 0;">EveryDriver</p>
        </div>
        
        <div style="padding: 24px 0;">
          <p style="color: #333; font-size: 16px;">Hi ${instructor.name || "there"},</p>
          <p style="color: #666; font-size: 14px;">Thank you for your subscription payment. Here's your receipt:</p>
        </div>

        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Plan</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${plan_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Amount</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${receiptDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Period</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${formattedStart} – ${formattedEnd}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Reference</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${payment_reference || payment_id || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Method</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">Direct Debit</td>
            </tr>
          </table>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          This payment was collected via Direct Debit and is protected by the Direct Debit Guarantee.
          If you have any questions, contact us at hello@drive365.co.uk
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EveryDriver <noreply@everydriver.co.uk>",
        to: instructor.email,
        subject: `Payment Receipt - ${plan_name} Plan - ${receiptDate}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend error:", errorData);
      throw new Error("Failed to send receipt email");
    }

    // Mark receipt as sent
    if (payment_id) {
      await supabase
        .from("subscription_payments")
        .update({ receipt_sent: true })
        .eq("gocardless_payment_id", payment_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending receipt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
