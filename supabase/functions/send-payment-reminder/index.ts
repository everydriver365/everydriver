import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  instructorId: string;
  instructorName: string;
  pupilIds?: string[];
  method?: "sms" | "email" | "both"; // default: sms
  paymentLink?: string; // optional custom payment link
  manualPhone?: string; // override phone number
  manualEmail?: string; // override email address
  manualName?: string; // name for manual-only sends
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: PaymentReminderRequest = await req.json();
    let method = data.method || "sms";

    // Email channel is admin-only. Downgrade non-admin email/both requests to SMS.
    if (method === "email" || method === "both") {
      const isAdmin = await callerIsAdmin(req);
      if (!isAdmin) {
        method = "sms";
      }
    }

    console.log("Payment reminder request:", { ...data, method });

    // If manual-only (no pupilIds), send directly using manual contact info
    if (!data.pupilIds || data.pupilIds.length === 0) {
      const results = { sent: 0, emailSent: 0, failed: 0, skipped: 0, details: [] as { name: string; status: string; error?: string }[] };
      const recipientName = data.manualName || "there";
      const paymentLink = data.paymentLink || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pay/${data.instructorId}`;

      // SMS
      if ((method === "sms" || method === "both") && data.manualPhone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const message = `💳 Payment Reminder: Hi ${recipientName}, pay here: ${paymentLink} — ${data.instructorName}`;
        try {
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
            method: "POST",
            headers: { Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ To: data.manualPhone, From: twilioPhoneNumber, Body: message }),
          });
          const result = await response.json();
          if (response.ok) { results.sent++; results.details.push({ name: recipientName, status: "sms_sent" }); }
          else { results.failed++; results.details.push({ name: recipientName, status: "sms_failed", error: result.message }); }
        } catch (e) { results.failed++; results.details.push({ name: recipientName, status: "sms_failed", error: e instanceof Error ? e.message : "Unknown error" }); }
      }

      // Email
      if ((method === "email" || method === "both") && data.manualEmail && resendApiKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `${data.instructorName} <payments@everydriver.lovable.app>`,
              to: [data.manualEmail],
              subject: `Payment Link from ${data.instructorName}`,
              html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;"><h2 style="color: #1a1a1a;">Payment Link</h2><p>Hi ${recipientName},</p><p>${data.instructorName} has sent you a payment link.</p><p style="margin: 24px 0;"><a href="${paymentLink}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Pay Now</a></p><p style="color: #666; font-size: 14px;">Thank you!<br/>${data.instructorName}</p></div>`,
            }),
          });
          if (emailResponse.ok) { results.emailSent++; results.details.push({ name: recipientName, status: "email_sent" }); }
          else { const errBody = await emailResponse.text(); results.failed++; results.details.push({ name: recipientName, status: "email_failed", error: errBody }); }
        } catch (e) { results.failed++; results.details.push({ name: recipientName, status: "email_failed", error: e instanceof Error ? e.message : "Unknown error" }); }
      }

      console.log("Manual send results:", results);
      return new Response(JSON.stringify({ success: true, ...results }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch pupils with outstanding balances (negative balance)
    let query = supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance")
      .eq("instructor_id", data.instructorId)
      .lt("account_balance", 0);

    if (data.pupilIds && data.pupilIds.length > 0) {
      query = query.in("id", data.pupilIds);
    }

    const { data: pupils, error: pupilsError } = await query;

    if (pupilsError) {
      console.error("Error fetching pupils:", pupilsError);
      throw pupilsError;
    }

    if (!pupils || pupils.length === 0) {
      console.log("No pupils with outstanding balances found");
      return new Response(
        JSON.stringify({ success: true, sent: 0, emailSent: 0, message: "No pupils with outstanding balances" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      sent: 0,
      emailSent: 0,
      failed: 0,
      skipped: 0,
      details: [] as { name: string; status: string; error?: string }[],
    };

    for (const pupil of pupils) {
      const amountOwed = Math.abs(Number(pupil.account_balance));
      const formattedAmount = `£${amountOwed.toFixed(2)}`;
      const paymentLink = data.paymentLink || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pay/${data.instructorId}?pupil=${pupil.id}`;
      const phoneToUse = data.manualPhone || pupil.phone;
      const emailToUse = data.manualEmail || pupil.email;

      // --- SMS ---
      if ((method === "sms" || method === "both") && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        if (!phoneToUse) {
          results.skipped++;
          results.details.push({ name: pupil.name, status: "skipped_sms", error: "No phone number" });
        } else {
          const message = `💳 Payment Reminder: Hi ${pupil.name}, you have an outstanding balance of ${formattedAmount}. Pay here: ${paymentLink} — ${data.instructorName}`;
          try {
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: phoneToUse,
                  From: twilioPhoneNumber,
                  Body: message,
                }),
              }
            );
            const result = await response.json();
            if (response.ok) {
              results.sent++;
              results.details.push({ name: pupil.name, status: "sms_sent" });
            } else {
              results.failed++;
              results.details.push({ name: pupil.name, status: "sms_failed", error: result.message });
            }
          } catch (smsError) {
            results.failed++;
            results.details.push({ name: pupil.name, status: "sms_failed", error: smsError instanceof Error ? smsError.message : "Unknown error" });
          }
        }
      }

      // --- Email ---
      if ((method === "email" || method === "both") && resendApiKey) {
        if (!emailToUse) {
          results.skipped++;
          results.details.push({ name: pupil.name, status: "skipped_email", error: "No email" });
        } else {
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: `${data.instructorName} <payments@everydriver.lovable.app>`,
                to: [emailToUse],
                subject: `Payment Reminder — ${formattedAmount} outstanding`,
                html: `
                  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #1a1a1a;">Payment Reminder</h2>
                    <p>Hi ${pupil.name},</p>
                    <p>You have an outstanding balance of <strong>${formattedAmount}</strong> for your driving lessons with ${data.instructorName}.</p>
                    <p style="margin: 24px 0;">
                      <a href="${paymentLink}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Pay Now
                      </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">Thank you!<br/>${data.instructorName}</p>
                  </div>
                `,
              }),
            });
            if (emailResponse.ok) {
              results.emailSent++;
              results.details.push({ name: pupil.name, status: "email_sent" });
            } else {
              const errBody = await emailResponse.text();
              results.failed++;
              results.details.push({ name: pupil.name, status: "email_failed", error: errBody });
            }
          } catch (emailError) {
            results.failed++;
            results.details.push({ name: pupil.name, status: "email_failed", error: emailError instanceof Error ? emailError.message : "Unknown error" });
          }
        }
      }
    }

    console.log("Reminder results:", results);

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.sent,
        emailSent: results.emailSent,
        failed: results.failed,
        skipped: results.skipped,
        details: results.details,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-payment-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
