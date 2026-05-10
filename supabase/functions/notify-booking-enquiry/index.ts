import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "npm:resend@4.0.1";
import { shouldSendToInstructor } from "../_shared/notify-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://everydriver.lovable.app";

interface NotifyEnquiryBody {
  enquiryId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { enquiryId } = (await req.json()) as NotifyEnquiryBody;
    if (!enquiryId) {
      return new Response(JSON.stringify({ error: "enquiryId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: enquiry, error: eErr } = await supabase
      .from("booking_enquiries")
      .select("id, instructor_id, pupil_name, pupil_email, pupil_phone, pupil_postcode, course_name, course_hours, message, source, created_at")
      .eq("id", enquiryId)
      .single();
    if (eErr || !enquiry) throw eErr || new Error("Enquiry not found");

    const { data: instructor } = await supabase
      .from("instructors")
      .select("id, name, phone, email, slug")
      .eq("id", enquiry.instructor_id)
      .single();
    if (!instructor) throw new Error("Instructor not found");

    const enquiriesUrl = `${BASE_URL}/instructor/enquiries`;
    const summaryLine =
      `${enquiry.pupil_name} · ${enquiry.pupil_phone}${enquiry.pupil_postcode ? ` · ${enquiry.pupil_postcode}` : ""}` +
      `${enquiry.course_name ? ` · ${enquiry.course_name}` : ""}`;
    const shortMsg = `📩 New enquiry: ${summaryLine}. Reply in your inbox: ${enquiriesUrl}`;

    const results: Record<string, unknown> = {
      whatsappSent: false,
      smsSent: false,
      emailSent: false,
      gateBlocked: null as string | null,
    };

    // Resolve gate decisions per channel up-front. New enquiries are job leads.
    const [waGate, smsGate, emailGate] = await Promise.all([
      shouldSendToInstructor(supabase, instructor.id, { category: "job", channel: "push" }),
      shouldSendToInstructor(supabase, instructor.id, { category: "job", channel: "sms" }),
      shouldSendToInstructor(supabase, instructor.id, { category: "job", channel: "email" }),
    ]);
    if (!waGate.allow && !smsGate.allow && !emailGate.allow) {
      results.gateBlocked = waGate.reason ?? smsGate.reason ?? emailGate.reason ?? "blocked";
    }

    // ---- WhatsApp / SMS via existing notify-instructor logic? Use Twilio direct + WhatsApp Business
    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
    const TWILIO_MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    // WhatsApp via Meta (per-instructor account first)
    let WA_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
    let WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    try {
      const { data: acct } = await supabase
        .from("instructor_whatsapp_accounts")
        .select("access_token, phone_number_id, status")
        .eq("instructor_id", instructor.id)
        .maybeSingle();
      if (acct?.access_token && acct?.phone_number_id && acct.status === "connected") {
        WA_TOKEN = acct.access_token;
        WA_PHONE_ID = acct.phone_number_id;
      }
    } catch (_) { /* ignore */ }

    if (waGate.allow && WA_TOKEN && WA_PHONE_ID && instructor.phone) {
      try {
        const waRes = await fetch(
          `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WA_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: instructor.phone.replace(/[^\d+]/g, ""),
              type: "text",
              text: { body: shortMsg },
            }),
          },
        );
        results.whatsappSent = waRes.ok;
        if (!waRes.ok) results.whatsappError = await waRes.text();
      } catch (e) {
        results.whatsappError = e instanceof Error ? e.message : String(e);
      }
    }

    // SMS via Twilio (always send as backup)
    if (smsGate.allow && TWILIO_SID && TWILIO_TOKEN && (TWILIO_FROM || TWILIO_MSG_SID) && instructor.phone) {
      try {
        const params = new URLSearchParams({
          To: instructor.phone,
          Body: shortMsg,
        });
        if (TWILIO_MSG_SID) params.set("MessagingServiceSid", TWILIO_MSG_SID);
        else if (TWILIO_FROM) params.set("From", TWILIO_FROM);

        const smsRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
          },
        );
        results.smsSent = smsRes.ok;
        if (!smsRes.ok) results.smsError = (await smsRes.json()).message;
      } catch (e) {
        results.smsError = e instanceof Error ? e.message : String(e);
      }
    }

    // Email via Resend
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_KEY && instructor.email) {
      try {
        const resend = new Resend(RESEND_KEY);
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#111">
            <h2 style="margin:0 0 4px;font-size:20px">📩 New booking enquiry</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:13px">
              Source: ${enquiry.source || "website"}
            </p>
            <div style="background:#F9FAFB;border-radius:12px;padding:16px;border:1px solid #E5E7EB">
              <p style="margin:0 0 6px"><strong>${escapeHtml(enquiry.pupil_name)}</strong></p>
              <p style="margin:0 0 4px;font-size:14px">📞 ${escapeHtml(enquiry.pupil_phone)}</p>
              <p style="margin:0 0 4px;font-size:14px">✉️ ${escapeHtml(enquiry.pupil_email)}</p>
              ${enquiry.pupil_postcode ? `<p style="margin:0 0 4px;font-size:14px">📍 ${escapeHtml(enquiry.pupil_postcode)}</p>` : ""}
              ${enquiry.course_name ? `<p style="margin:8px 0 0;font-size:13px;color:#374151">Interested in: <strong>${escapeHtml(enquiry.course_name)}</strong>${enquiry.course_hours ? ` · ${enquiry.course_hours}h` : ""}</p>` : ""}
              ${enquiry.message ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E5E7EB;font-size:14px;white-space:pre-wrap">${escapeHtml(enquiry.message)}</div>` : ""}
            </div>
            <div style="margin-top:24px">
              <a href="${enquiriesUrl}" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Open enquiry inbox</a>
            </div>
            <p style="margin-top:16px;color:#6b7280;font-size:12px">Tip: respond within an hour to triple your conversion rate.</p>
          </div>`;

        const emailRes = await resend.emails.send({
          from: "Drive 365 <enquiries@notifications.drive365.co.uk>",
          to: [instructor.email],
          reply_to: enquiry.pupil_email,
          subject: `New enquiry — ${enquiry.pupil_name}`,
          html,
        });
        results.emailSent = !emailRes.error;
        if (emailRes.error) results.emailError = emailRes.error.message;
      } catch (e) {
        results.emailError = e instanceof Error ? e.message : String(e);
      }
    }

    // Push notification reuse — fire-and-forget call to notify-instructor with admin_message style
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-instructor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          instructorId: instructor.id,
          type: "pupil_message",
          pupilName: enquiry.pupil_name,
          messagePreview: `New enquiry${enquiry.course_name ? ` · ${enquiry.course_name}` : ""}`,
        }),
      });
      results.pushTriggered = true;
    } catch (e) {
      results.pushError = e instanceof Error ? e.message : String(e);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-booking-enquiry error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
