import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_ENQUIRY_EMAIL") || "enquiries@everydriver.co.uk";
const ADMIN_BASE = "https://everydriver.co.uk";

interface Body { enquiryId: string }

function formatUkTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
    return `${date} at ${time}`;
  } catch { return iso; }
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
      .eq("id", enquiryId).single();
    if (eErr || !enquiry) throw eErr || new Error("Enquiry not found");

    const { data: instructor } = await supabase
      .from("instructors")
      .select("id, name, email, phone, home_postcode, location_name, booking_mode")
      .eq("id", enquiry.instructor_id).single();
    if (!instructor) throw new Error("Instructor not found");

    const { data: settings } = await supabase
      .from("site_settings")
      .select("admin_notification_emails")
      .limit(1).maybeSingle();
    const configured = ((settings as any)?.admin_notification_emails ?? []) as string[];
    const recipients = (Array.isArray(configured) && configured.length > 0)
      ? configured.filter((e) => typeof e === "string" && e.includes("@"))
      : [ADMIN_EMAIL];

    const submitted = formatUkTime(enquiry.created_at);
    const sourcePage = enquiry.source_page || enquiry.source || "—";

    const result = await sendBrandedEmail({
      to: recipients,
      subject: `New enquiry: ${enquiry.pupil_name} → ${instructor.name}`,
      heading: "New enquiry received",
      intro: `Submitted ${submitted} · via ${sourcePage}`,
      paragraphs: enquiry.message
        ? [`Their message:\n${enquiry.message}`]
        : ["No message included."],
      details: [
        { label: "Learner", value: enquiry.pupil_name || "—" },
        { label: "Email", value: enquiry.pupil_email || "—" },
        { label: "Phone", value: enquiry.pupil_phone || "—" },
        { label: "Postcode", value: enquiry.pupil_postcode || "—" },
        { label: "Course", value: enquiry.course_name || "—" },
        { label: "Hours", value: enquiry.course_hours ? String(enquiry.course_hours) : "—" },
        { label: "Instructor", value: instructor.name || "—" },
        { label: "Instructor email", value: instructor.email || "—" },
        { label: "Instructor phone", value: instructor.phone || "—" },
        { label: "Area", value: instructor.location_name || instructor.home_postcode || "—" },
      ],
      ctaLabel: "View enquiry in admin",
      ctaUrl: `${ADMIN_BASE}/admin/enquiries`,
      idempotencyKey: `notify-admin-enquiry-${enquiryId}`,
    }, supabase);

    if (result.enqueued === 0) {
      throw new Error(`Email send failed: ${result.errors.join("; ")}`);
    }

    await supabase
      .from("booking_enquiries")
      .update({ admin_email_sent_at: new Date().toISOString(), admin_email_error: null })
      .eq("id", enquiryId);

    return new Response(JSON.stringify({ ok: true, enqueued: result.enqueued }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("notify-admin-enquiry error", msg);
    if (enquiryId) {
      await supabase.from("booking_enquiries")
        .update({ admin_email_error: msg.slice(0, 500) }).eq("id", enquiryId);
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
