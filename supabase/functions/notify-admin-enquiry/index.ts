import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_ENQUIRY_EMAIL") || "enquiries@drive365.co.uk";
const ADMIN_BASE = "https://everydriver.lovable.app";
const DRIVE365_LOGO_URL = "https://everydriver.lovable.app/drive365-logo.png";

const D365_PRIMARY = "#142040";
const D365_ACCENT = "#2B7BC8";
const D365_TEXT = "#0f172a";
const D365_TEXT_MUTED = "#5b6577";
const D365_BORDER = "#e3e7ee";
const D365_TINT = "#eef1f8";
const D365_SOFT = "#f4f6fa";

interface Body {
  enquiryId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let enquiryId: string | undefined;
  try {
    const body = (await req.json()) as Body;
    enquiryId = body.enquiryId;
    if (!enquiryId) throw new Error("enquiryId required");

    const { data: enquiry, error: eErr } = await supabase
      .from("booking_enquiries")
      .select("id, instructor_id, pupil_name, pupil_email, pupil_phone, pupil_postcode, course_name, course_hours, message, source, source_page, created_at")
      .eq("id", enquiryId)
      .single();
    if (eErr || !enquiry) throw eErr || new Error("Enquiry not found");

    const { data: instructor } = await supabase
      .from("instructors")
      .select("id, name, email, phone, home_postcode, location_name, booking_mode")
      .eq("id", enquiry.instructor_id)
      .single();
    if (!instructor) throw new Error("Instructor not found");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(RESEND_API_KEY);

    const learnerFirst = (enquiry.pupil_name || "").split(/\s+/)[0] || "the learner";
    const subject = `New enquiry: ${enquiry.pupil_name} → ${instructor.name}`;
    const html = renderHtml(enquiry, instructor);
    const text = renderText(enquiry, instructor);

    const result = await resend.emails.send({
      from: "Drive365 Enquiries <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      reply_to: enquiry.pupil_email,
      subject,
      html,
      text,
    } as any);

    if ((result as any)?.error) {
      throw new Error(JSON.stringify((result as any).error));
    }

    await supabase
      .from("booking_enquiries")
      .update({ admin_email_sent_at: new Date().toISOString(), admin_email_error: null })
      .eq("id", enquiryId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("notify-admin-enquiry error", msg);
    if (enquiryId) {
      await supabase
        .from("booking_enquiries")
        .update({ admin_email_error: msg.slice(0, 500) })
        .eq("id", enquiryId);
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escape(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatUkTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
    return `${date} at ${time}`;
  } catch {
    return iso;
  }
}

function renderHtml(enquiry: any, instructor: any): string {
  const learnerFirst = (enquiry.pupil_name || "").split(/\s+/)[0] || "the learner";
  const submitted = formatUkTime(enquiry.created_at);
  const sourcePage = enquiry.source_page || enquiry.source || "—";
  const ctaUrl = `${ADMIN_BASE}/admin/enquiries`;

  const message = enquiry.message
    ? escape(enquiry.message).replace(/\n/g, "<br/>")
    : '<span style="color:#9aa3b3;font-style:italic;">— No message included —</span>';

  const learnerRows = [
    ["Name", escape(enquiry.pupil_name)],
    ["Email", `<a href="mailto:${escape(enquiry.pupil_email)}" style="color:${D365_PRIMARY};text-decoration:underline;">${escape(enquiry.pupil_email)}</a>`],
    ["Phone", `<a href="tel:${escape(enquiry.pupil_phone)}" style="color:${D365_PRIMARY};text-decoration:underline;">${escape(enquiry.pupil_phone)}</a>`],
    ["Postcode", escape(enquiry.pupil_postcode) || "—"],
  ];

  const instructorRows = [
    ["Name", escape(instructor.name)],
    ["Email", instructor.email
      ? `<a href="mailto:${escape(instructor.email)}" style="color:${D365_PRIMARY};text-decoration:underline;">${escape(instructor.email)}</a>`
      : "—"],
    ["Phone", instructor.phone
      ? `<a href="tel:${escape(instructor.phone)}" style="color:${D365_PRIMARY};text-decoration:underline;">${escape(instructor.phone)}</a>`
      : "—"],
    ["Area", escape(instructor.location_name || instructor.home_postcode) || "—"],
    ["Booking method", escape(instructor.booking_mode || "—")],
  ];

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Drive365 enquiry</title>
<style>
  @media only screen and (max-width: 480px) {
    .d365-stack td { display:block !important; width:100% !important; padding:4px 0 !important; border:0 !important; }
    .d365-cta { display:block !important; width:100% !important; box-sizing:border-box; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${D365_SOFT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${D365_TEXT};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${D365_SOFT};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${D365_BORDER};">
      <!-- Header -->
      <tr><td style="background:${D365_PRIMARY};padding:22px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
          <td align="left" style="vertical-align:middle;">
            <img src="${DRIVE365_LOGO_URL}" alt="Drive365" height="28" style="display:inline-block;height:28px;width:auto;filter:brightness(0) invert(1);"/>
          </td>
          <td align="right" style="vertical-align:middle;">
            <span style="display:inline-block;background:${D365_ACCENT};color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.1em;padding:5px 10px;border-radius:999px;text-transform:uppercase;">NEW ENQUIRY</span>
          </td>
        </tr></table>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:28px 24px 8px;">
        <h1 style="margin:0;font-size:20px;font-weight:700;color:${D365_PRIMARY};">New enquiry received</h1>
        <p style="margin:6px 0 0;font-size:12px;color:${D365_TEXT_MUTED};">Submitted ${submitted} · via ${escape(sourcePage)}</p>
      </td></tr>

      <!-- Learner block -->
      <tr><td style="padding:18px 24px 0;">
        <div style="background:${D365_SOFT};border-radius:10px;padding:16px;">
          <div style="font-size:10.5px;font-weight:700;letter-spacing:0.08em;color:${D365_TEXT_MUTED};margin-bottom:10px;">LEARNER</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="d365-stack">
            ${learnerRows.map(([k, v], i) => `
              <tr>
                <td style="font-size:12.5px;color:${D365_TEXT_MUTED};padding:8px 12px 8px 0;width:90px;border-bottom:${i < learnerRows.length - 1 ? `1px solid ${D365_BORDER}` : "none"};vertical-align:top;">${k}</td>
                <td style="font-size:13.5px;color:${D365_TEXT};font-weight:500;padding:8px 0;border-bottom:${i < learnerRows.length - 1 ? `1px solid ${D365_BORDER}` : "none"};vertical-align:top;">${v}</td>
              </tr>`).join("")}
          </table>
        </div>
      </td></tr>

      <!-- Their message -->
      <tr><td style="padding:18px 24px 0;">
        <div style="font-size:10.5px;font-weight:700;letter-spacing:0.08em;color:${D365_TEXT_MUTED};margin-bottom:8px;">THEIR MESSAGE</div>
        <div style="background:${D365_TINT};border-left:3px solid ${D365_PRIMARY};border-radius:6px;padding:14px 16px;font-style:italic;color:${D365_PRIMARY};font-size:13.5px;line-height:1.55;">${message}</div>
      </td></tr>

      <!-- Instructor block -->
      <tr><td style="padding:18px 24px 0;">
        <div style="background:${D365_SOFT};border-radius:10px;padding:16px;">
          <div style="font-size:10.5px;font-weight:700;letter-spacing:0.08em;color:${D365_TEXT_MUTED};margin-bottom:10px;">ENQUIRING WITH</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="d365-stack">
            ${instructorRows.map(([k, v], i) => `
              <tr>
                <td style="font-size:12.5px;color:${D365_TEXT_MUTED};padding:8px 12px 8px 0;width:120px;border-bottom:${i < instructorRows.length - 1 ? `1px solid ${D365_BORDER}` : "none"};vertical-align:top;">${k}</td>
                <td style="font-size:13.5px;color:${D365_TEXT};font-weight:500;padding:8px 0;border-bottom:${i < instructorRows.length - 1 ? `1px solid ${D365_BORDER}` : "none"};vertical-align:top;">${v}</td>
              </tr>`).join("")}
          </table>
        </div>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:24px 24px 28px;">
        <a class="d365-cta" href="${ctaUrl}" style="display:inline-block;background:${D365_PRIMARY};color:#ffffff;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;">View enquiry in admin →</a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="border-top:1px solid ${D365_BORDER};background:${D365_SOFT};padding:18px 24px;text-align:center;font-size:11px;color:${D365_TEXT_MUTED};line-height:1.5;">
        <strong style="color:${D365_TEXT};">Automated notification</strong> from Drive365. Reply to this email to respond directly to ${escape(learnerFirst)}.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderText(enquiry: any, instructor: any): string {
  const submitted = formatUkTime(enquiry.created_at);
  return [
    "NEW ENQUIRY — Drive365",
    `Submitted: ${submitted}`,
    `Source: ${enquiry.source_page || enquiry.source || "—"}`,
    "",
    "LEARNER",
    `Name: ${enquiry.pupil_name || "—"}`,
    `Email: ${enquiry.pupil_email || "—"}`,
    `Phone: ${enquiry.pupil_phone || "—"}`,
    `Postcode: ${enquiry.pupil_postcode || "—"}`,
    "",
    "THEIR MESSAGE",
    enquiry.message || "— No message included —",
    "",
    "ENQUIRING WITH",
    `Name: ${instructor.name || "—"}`,
    `Email: ${instructor.email || "—"}`,
    `Phone: ${instructor.phone || "—"}`,
    `Area: ${instructor.location_name || instructor.home_postcode || "—"}`,
    `Booking method: ${instructor.booking_mode || "—"}`,
    "",
    `View in admin: ${ADMIN_BASE}/admin/enquiries`,
  ].join("\n");
}
