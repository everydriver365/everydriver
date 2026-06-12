import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://everydriver.co.uk";

function getActivePaymentQrUrl(instructor: {
  commission_payer?: string | null;
  payment_qr_url_pupil_pays?: string | null;
  payment_qr_url_instructor_pays?: string | null;
  payment_qr_url?: string | null;
}): string | null {
  if (instructor.commission_payer === "instructor") {
    return instructor.payment_qr_url_instructor_pays || instructor.payment_qr_url || null;
  }
  return instructor.payment_qr_url_pupil_pays || instructor.payment_qr_url || null;
}

function formatLessonDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function formatLessonTime(timeStr: string) {
  const [h, m] = timeStr.slice(0, 5).split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m}${ampm}`;
}

async function isAuthorizedCaller(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (token === serviceKey) return true;
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!(await isAuthorizedCaller(req))) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const {
      pupilId, pupilName, pupilEmail, pupilPhone,
      instructorId, courseType, courseHours,
      firstLessonDate, firstLessonTime, pickupAddress,
      allLessons,
    } = await req.json();

    if (!pupilEmail || !instructorId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, phone, email, vehicle_type, transmission, slug, commission_payer, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays")
      .eq("id", instructorId).single();
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const paymentQrUrl = getActivePaymentQrUrl(instructor);
    const portalUrl = instructor.slug ? `${BASE_URL}/p/${instructor.slug}` : `${BASE_URL}/pupil/login`;
    const miniWebsiteUrl = instructor.slug ? `${BASE_URL}/i/${instructor.slug}` : null;

    const details = [
      { label: "Instructor", value: instructor.name || "Your Instructor" },
      ...(instructor.phone ? [{ label: "Phone", value: instructor.phone }] : []),
      ...(instructor.email ? [{ label: "Email", value: instructor.email }] : []),
      ...(instructor.vehicle_type || instructor.transmission
        ? [{ label: "Vehicle", value: [instructor.vehicle_type, instructor.transmission].filter(Boolean).join(" — ") }]
        : []),
      { label: "Course", value: `${courseType || "Driving Course"} (${courseHours || 0} hours)` },
    ];

    const paragraphs: string[] = [];
    if (allLessons && allLessons.length > 1) {
      paragraphs.push(`Your scheduled lessons (${allLessons.length}):\n` +
        allLessons.map((l: any) => {
          const dur = l.durationMinutes || 60;
          const durLabel = dur >= 60 ? `${dur / 60}h` : `${dur}min`;
          return `• ${formatLessonDate(l.date)} at ${formatLessonTime(l.time)} (${durLabel})`;
        }).join("\n"));
      if (pickupAddress) paragraphs.push(`Pickup: ${pickupAddress}`);
    } else if (firstLessonDate) {
      paragraphs.push(`Your first lesson: ${firstLessonDate}${firstLessonTime ? ` at ${firstLessonTime}` : ""}${pickupAddress ? `\nPickup: ${pickupAddress}` : ""}`);
    }

    paragraphs.push(
      `Tips for your first lesson:\n• Bring your provisional driving licence\n• Wear comfortable shoes (flat soles)\n• Be ready 5 minutes before your pickup time\n• Bring glasses or contact lenses if you need them for driving`,
    );

    if (paymentQrUrl) {
      paragraphs.push("Payment: scan the QR code in your portal, or use the Pay Online link below.");
    }

    paragraphs.push(`Your portals:\n• Pupil Portal: ${BASE_URL}/pupil/login\n• Parent Portal: ${BASE_URL}/parent${miniWebsiteUrl ? `\n• Instructor website: ${miniWebsiteUrl}` : ""}`);

    const result = await sendBrandedEmail({
      to: pupilEmail,
      subject: `Welcome! Your driving lessons with ${instructor.name || "your instructor"} are confirmed`,
      heading: "Welcome to your driving journey!",
      intro: `Hi ${pupilName || "there"} — great news, your driving course with ${instructor.name || "your instructor"} has been booked. Here's everything you need to get started.`,
      details,
      paragraphs,
      ctaLabel: "Open your pupil portal",
      ctaUrl: portalUrl,
      footerNote: `Sent by EveryDriver on behalf of ${instructor.name || "your instructor"}.`,
      idempotencyKey: `pupil-welcome-${pupilId || pupilEmail}-${instructorId}`,
    }, supabase);

    return new Response(JSON.stringify({ success: result.enqueued > 0, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
