import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  instructorId: string;
  instructorName: string;
  pupilIds?: string[];
  method?: "sms" | "email" | "both";
  paymentLink?: string;
  manualPhone?: string;
  manualEmail?: string;
  manualName?: string;
}

async function callerIsAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "");
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims } = await supa.auth.getClaims(token);
  if (!claims?.claims?.sub) return false;
  const { data: isAdmin } = await supa.rpc("has_role", {
    _user_id: claims.claims.sub, _role: "admin",
  });
  return Boolean(isAdmin);
}

async function sendTwilioSms(to: string, body: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_PHONE_NUMBER");
  if (!sid || !token || !from) return { ok: false, error: "Twilio not configured" };
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );
    if (response.ok) return { ok: true };
    const j = await response.json();
    return { ok: false, error: j.message };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Unknown" }; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const data: PaymentReminderRequest = await req.json();
    let method = data.method || "sms";

    if (method === "email" || method === "both") {
      const isAdmin = await callerIsAdmin(req);
      if (!isAdmin) method = "sms";
    }

    const results = {
      sent: 0, emailSent: 0, failed: 0, skipped: 0,
      details: [] as { name: string; status: string; error?: string }[],
    };

    // Manual-only path
    if (!data.pupilIds || data.pupilIds.length === 0) {
      const recipientName = data.manualName || "there";
      const paymentLink = data.paymentLink || `https://everydriver.co.uk/pay/${data.instructorId}`;

      if ((method === "sms" || method === "both") && data.manualPhone) {
        const sms = await sendTwilioSms(data.manualPhone,
          `💳 Payment Reminder: Hi ${recipientName}, pay here: ${paymentLink} — ${data.instructorName}`);
        if (sms.ok) { results.sent++; results.details.push({ name: recipientName, status: "sms_sent" }); }
        else { results.failed++; results.details.push({ name: recipientName, status: "sms_failed", error: sms.error }); }
      }

      if ((method === "email" || method === "both") && data.manualEmail) {
        const r = await sendBrandedEmail({
          to: data.manualEmail,
          subject: `Payment Link from ${data.instructorName}`,
          heading: "Payment link",
          intro: `Hi ${recipientName}, ${data.instructorName} has sent you a payment link.`,
          ctaLabel: "Pay now",
          ctaUrl: paymentLink,
          signOff: `Thank you!\n${data.instructorName}`,
          idempotencyKey: `pay-manual-${data.instructorId}-${data.manualEmail}-${Date.now()}`,
        }, supabase);
        if (r.enqueued > 0) { results.emailSent++; results.details.push({ name: recipientName, status: "email_sent" }); }
        else { results.failed++; results.details.push({ name: recipientName, status: "email_failed", error: r.errors.join("; ") }); }
      }

      return new Response(JSON.stringify({ success: true, ...results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Bulk path: pupils with outstanding balances
    let query = supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance")
      .eq("instructor_id", data.instructorId)
      .lt("account_balance", 0);
    if (data.pupilIds && data.pupilIds.length > 0) query = query.in("id", data.pupilIds);

    const { data: pupils, error: pupilsError } = await query;
    if (pupilsError) throw pupilsError;

    if (!pupils || pupils.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, emailSent: 0, message: "No pupils with outstanding balances" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    for (const pupil of pupils) {
      const amountOwed = Math.abs(Number(pupil.account_balance));
      const formattedAmount = `£${amountOwed.toFixed(2)}`;
      const paymentLink = data.paymentLink || `https://everydriver.co.uk/pay/${pupil.id}`;
      const phoneToUse = data.manualPhone || pupil.phone;
      const emailToUse = data.manualEmail || pupil.email;

      if (method === "sms" || method === "both") {
        if (!phoneToUse) {
          results.skipped++; results.details.push({ name: pupil.name, status: "skipped_sms", error: "No phone number" });
        } else {
          const sms = await sendTwilioSms(phoneToUse,
            `💳 Payment Reminder: Hi ${pupil.name}, you have an outstanding balance of ${formattedAmount}. Pay here: ${paymentLink} — ${data.instructorName}`);
          if (sms.ok) { results.sent++; results.details.push({ name: pupil.name, status: "sms_sent" }); }
          else { results.failed++; results.details.push({ name: pupil.name, status: "sms_failed", error: sms.error }); }
        }
      }

      if (method === "email" || method === "both") {
        if (!emailToUse) {
          results.skipped++; results.details.push({ name: pupil.name, status: "skipped_email", error: "No email" });
        } else {
          const r = await sendBrandedEmail({
            to: emailToUse,
            subject: `Payment Reminder — ${formattedAmount} outstanding`,
            heading: "Payment reminder",
            intro: `Hi ${pupil.name}, you have an outstanding balance of ${formattedAmount} for your driving lessons with ${data.instructorName}.`,
            ctaLabel: "Pay now",
            ctaUrl: paymentLink,
            signOff: `Thank you!\n${data.instructorName}`,
            idempotencyKey: `pay-rem-${pupil.id}-${new Date().toISOString().slice(0,10)}`,
          }, supabase);
          if (r.enqueued > 0) { results.emailSent++; results.details.push({ name: pupil.name, status: "email_sent" }); }
          else { results.failed++; results.details.push({ name: pupil.name, status: "email_failed", error: r.errors.join("; ") }); }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
