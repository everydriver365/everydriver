import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { shouldSendToInstructor } from "../_shared/notify-gate.ts";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://everydriver.co.uk";

interface NotifyEnquiryBody { enquiryId: string }

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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: enquiry, error: eErr } = await supabase
      .from("booking_enquiries")
      .select("id, instructor_id, pupil_name, pupil_email, pupil_phone, pupil_postcode, course_name, course_hours, message, source, created_at")
      .eq("id", enquiryId).single();
    if (eErr || !enquiry) throw eErr || new Error("Enquiry not found");

    const { data: instructor, error: iErr } = await supabase
      .from("instructors")
      .select("id, name, phone, email, app_slug")
      .eq("id", enquiry.instructor_id).single();
    if (iErr || !instructor) throw iErr || new Error("Instructor not found");

    const enquiriesUrl = `${BASE_URL}/instructor/enquiries`;
    const summaryLine =
      `${enquiry.pupil_name} · ${enquiry.pupil_phone}${enquiry.pupil_postcode ? ` · ${enquiry.pupil_postcode}` : ""}` +
      `${enquiry.course_name ? ` · ${enquiry.course_name}` : ""}`;
    const shortMsg = `📩 New enquiry: ${summaryLine}. Reply in your inbox: ${enquiriesUrl}`;

    const results: Record<string, unknown> = {
      whatsappSent: false, smsSent: false, emailSent: false,
      pupilEmailSent: false, gateBlocked: null as string | null,
    };

    const [waGate, smsGate, emailGate] = await Promise.all([
      shouldSendToInstructor(supabase, instructor.id, { category: "job", channel: "push" }),
      shouldSendToInstructor(supabase, instructor.id, { category: "job", channel: "sms" }),
      shouldSendToInstructor(supabase, instructor.id, { category: "job", channel: "email" }),
    ]);
    if (!waGate.allow && !smsGate.allow && !emailGate.allow) {
      results.gateBlocked = waGate.reason ?? smsGate.reason ?? emailGate.reason ?? "blocked";
    }

    // WhatsApp / SMS via Twilio + Meta (unchanged)
    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
    const TWILIO_MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    let WA_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
    let WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    try {
      const { data: acct } = await supabase
        .from("instructor_whatsapp_accounts")
        .select("access_token, phone_number_id, status")
        .eq("instructor_id", instructor.id).maybeSingle();
      if (acct?.access_token && acct?.phone_number_id && acct.status === "connected") {
        WA_TOKEN = acct.access_token;
        WA_PHONE_ID = acct.phone_number_id;
      }
    } catch (_) { /* ignore */ }

    if (waGate.allow && WA_TOKEN && WA_PHONE_ID && instructor.phone) {
      try {
        const waRes = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: instructor.phone.replace(/[^\d+]/g, ""),
            type: "text", text: { body: shortMsg },
          }),
        });
        results.whatsappSent = waRes.ok;
        if (!waRes.ok) results.whatsappError = await waRes.text();
      } catch (e) { results.whatsappError = e instanceof Error ? e.message : String(e); }
    }

    if (smsGate.allow && TWILIO_SID && TWILIO_TOKEN && (TWILIO_FROM || TWILIO_MSG_SID) && instructor.phone) {
      try {
        const params = new URLSearchParams({ To: instructor.phone, Body: shortMsg });
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
      } catch (e) { results.smsError = e instanceof Error ? e.message : String(e); }
    }

    // Instructor email via Lovable Emails
    if (emailGate.allow && instructor.email) {
      const r = await sendBrandedEmail({
        to: instructor.email,
        subject: `New enquiry — ${enquiry.pupil_name}`,
        heading: "📩 New booking enquiry",
        intro: `Source: ${enquiry.source || "website"}`,
        paragraphs: enquiry.message ? [enquiry.message] : [],
        details: [
          { label: "Name", value: enquiry.pupil_name || "—" },
          { label: "Phone", value: enquiry.pupil_phone || "—" },
          { label: "Email", value: enquiry.pupil_email || "—" },
          { label: "Postcode", value: enquiry.pupil_postcode || "—" },
          { label: "Course", value: enquiry.course_name || "—" },
          { label: "Hours", value: enquiry.course_hours ? `${enquiry.course_hours}h` : "—" },
        ],
        ctaLabel: "Open enquiry inbox",
        ctaUrl: enquiriesUrl,
        footerNote: "Tip: respond within an hour to triple your conversion rate.",
        idempotencyKey: `enq-instr-${enquiry.id}`,
      }, supabase);
      results.emailSent = r.enqueued > 0;
      if (r.enqueued === 0) results.emailError = r.errors.join("; ");
    }

    // Pupil confirmation email
    if (enquiry.pupil_email) {
      const pupilFirst = (enquiry.pupil_name || "").split(/\s+/)[0] || "there";
      const r = await sendBrandedEmail({
        to: enquiry.pupil_email,
        subject: `Thanks — we've passed your enquiry to ${instructor.name}`,
        heading: `Thanks ${pupilFirst} — we've got your enquiry`,
        intro: `We've passed your details to ${instructor.name}. They'll be in touch shortly to talk through next steps${enquiry.course_name ? ` for the ${enquiry.course_name}${enquiry.course_hours ? ` (${enquiry.course_hours} hours)` : ""}` : ""}.`,
        paragraphs: enquiry.message ? [enquiry.message] : [],
        details: [
          ...(enquiry.course_name ? [{ label: "Course", value: `${enquiry.course_name}${enquiry.course_hours ? ` · ${enquiry.course_hours}h` : ""}` }] : []),
          ...(enquiry.pupil_postcode ? [{ label: "Pickup area", value: enquiry.pupil_postcode }] : []),
        ],
        footerNote: `EveryDriver · ${instructor.name}`,
        idempotencyKey: `enq-pupil-${enquiry.id}`,
      }, supabase);
      results.pupilEmailSent = r.enqueued > 0;
      if (r.enqueued === 0) results.pupilEmailError = r.errors.join("; ");
    }

    // Push notification (unchanged)
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
    } catch (e) { results.pushError = e instanceof Error ? e.message : String(e); }

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
