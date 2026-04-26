import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://everydriver.lovable.app";

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

function buildEmailHtml(params: {
  pupilName: string;
  instructorName: string;
  instructorPhone: string | null;
  instructorEmail: string | null;
  vehicleType: string | null;
  transmission: string | null;
  profileImageUrl: string | null;
  slug: string | null;
  paymentQrUrl: string | null;
  firstLessonDate: string | null;
  firstLessonTime: string | null;
  pickupAddress: string | null;
  courseType: string;
  courseHours: number;
  allLessons?: { date: string; time: string; durationMinutes?: number }[];
}): string {
  const {
    pupilName, instructorName, instructorPhone, instructorEmail,
    vehicleType, transmission, profileImageUrl, slug,
    paymentQrUrl, firstLessonDate, firstLessonTime, pickupAddress,
    courseType, courseHours, allLessons,
  } = params;

  const portalUrl = slug ? `${BASE_URL}/p/${slug}` : `${BASE_URL}/pupil/login`;
  const miniWebsiteUrl = slug ? `${BASE_URL}/i/${slug}` : null;
  const parentPortalUrl = `${BASE_URL}/parent`;
  const pupilLoginUrl = `${BASE_URL}/pupil/login`;

  const vehicleInfo = [vehicleType, transmission].filter(Boolean).join(" — ");

  const profileSection = profileImageUrl
    ? `<img src="${profileImageUrl}" alt="${instructorName}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px;" />`
    : "";

  const formatLessonDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const formatLessonTime = (timeStr: string) => {
    const [h, m] = timeStr.slice(0, 5).split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${m}${ampm}`;
  };

  let lessonSection = "";
  if (allLessons && allLessons.length > 1) {
    const lessonRows = allLessons.map((l) => {
      const dur = l.durationMinutes || 60;
      const durLabel = dur >= 60 ? `${dur / 60}h` : `${dur}min`;
      return `<tr><td style="padding:4px 0;font-size:15px;color:#333;">📅 ${formatLessonDate(l.date)} at ${formatLessonTime(l.time)} (${durLabel})</td></tr>`;
    }).join("");
    lessonSection = `
      <tr><td style="padding:24px 32px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">📅 Your Scheduled Lessons (${allLessons.length})</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          ${lessonRows}
        </table>
        ${pickupAddress ? `<p style="margin:12px 0 0;font-size:14px;color:#555;"><strong>Pickup:</strong> ${pickupAddress}</p>` : ""}
        <p style="margin:8px 0 0;font-size:14px;color:#555;"><strong>Course:</strong> ${courseType} (${courseHours} hours)</p>
      </td></tr>
      <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>
    `;
  } else if (firstLessonDate) {
    lessonSection = `
      <tr><td style="padding:24px 32px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">📅 Your First Lesson</h2>
        <table cellpadding="4" cellspacing="0" style="font-size:15px;color:#333;">
          <tr><td style="font-weight:600;">Date:</td><td>${firstLessonDate}</td></tr>
          ${firstLessonTime ? `<tr><td style="font-weight:600;">Time:</td><td>${firstLessonTime}</td></tr>` : ""}
          ${pickupAddress ? `<tr><td style="font-weight:600;">Pickup:</td><td>${pickupAddress}</td></tr>` : ""}
          <tr><td style="font-weight:600;">Course:</td><td>${courseType} (${courseHours} hours)</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>
    `;
  }

  const paymentSection = paymentQrUrl
    ? `
      <tr><td style="padding:24px 32px;text-align:center;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">💳 Payment</h2>
        <p style="margin:0 0 16px;color:#555;font-size:14px;">Scan the QR code below to make a payment, or use the online portal.</p>
        <img src="${paymentQrUrl}" alt="Payment QR Code" style="width:180px;height:180px;margin-bottom:16px;" />
        <br />
        <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Pay Online</a>
      </td></tr>
      <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>
    `
    : `
      <tr><td style="padding:24px 32px;text-align:center;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">💳 Payment</h2>
        <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Pay Online</a>
      </td></tr>
      <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px;text-align:center;">
          ${profileSection}
          <h1 style="margin:0;color:#ffffff;font-size:24px;">Welcome to Your Driving Journey!</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:15px;">You're booked in with ${instructorName}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:24px 32px 8px;">
          <p style="margin:0;font-size:16px;color:#333;">Hi ${pupilName},</p>
          <p style="margin:8px 0 0;font-size:15px;color:#555;">Great news — your driving course has been booked! Here's everything you need to get started.</p>
        </td></tr>
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>

        <!-- Instructor Info -->
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">🚗 Your Instructor</h2>
          <table cellpadding="4" cellspacing="0" style="font-size:15px;color:#333;">
            <tr><td style="font-weight:600;">Name:</td><td>${instructorName}</td></tr>
            ${instructorPhone ? `<tr><td style="font-weight:600;">Phone:</td><td><a href="tel:${instructorPhone}" style="color:#2563eb;text-decoration:none;">${instructorPhone}</a></td></tr>` : ""}
            ${instructorEmail ? `<tr><td style="font-weight:600;">Email:</td><td><a href="mailto:${instructorEmail}" style="color:#2563eb;text-decoration:none;">${instructorEmail}</a></td></tr>` : ""}
            ${vehicleInfo ? `<tr><td style="font-weight:600;">Vehicle:</td><td>${vehicleInfo}</td></tr>` : ""}
          </table>
        </td></tr>
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>

        <!-- First Lesson -->
        ${lessonSection}

        <!-- Payment -->
        ${paymentSection}

        <!-- Portal Links -->
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">🔗 Your Portals</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;">
                <a href="${pupilLoginUrl}" style="color:#2563eb;text-decoration:none;font-size:15px;font-weight:600;">📱 Pupil Portal</a>
                <span style="color:#888;font-size:13px;"> — Track your progress, view lessons & pay</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <a href="${parentPortalUrl}" style="color:#2563eb;text-decoration:none;font-size:15px;font-weight:600;">👨‍👩‍👧 Parent Portal</a>
                <span style="color:#888;font-size:13px;"> — For parents and guardians</span>
              </td>
            </tr>
            ${miniWebsiteUrl ? `
            <tr>
              <td style="padding:8px 0;">
                <a href="${miniWebsiteUrl}" style="color:#2563eb;text-decoration:none;font-size:15px;font-weight:600;">🌐 Instructor Website</a>
                <span style="color:#888;font-size:13px;"> — Services, reviews & more info</span>
              </td>
            </tr>
            ` : ""}
          </table>
        </td></tr>
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>

        <!-- Tips -->
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">💡 Tips for Your First Lesson</h2>
          <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:14px;line-height:1.8;">
            <li>Bring your provisional driving licence</li>
            <li>Wear comfortable shoes (flat soles are best)</li>
            <li>Be ready 5 minutes before your pickup time</li>
            <li>Bring glasses or contact lenses if you need them for driving</li>
            <li>Don't worry — your instructor will guide you through everything!</li>
          </ul>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by EveryDriver on behalf of ${instructorName}</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">
            <a href="${BASE_URL}" style="color:#94a3b8;">everydriver.lovable.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      pupilId, pupilName, pupilEmail, pupilPhone,
      instructorId, courseType, courseHours,
      firstLessonDate, firstLessonTime, pickupAddress,
      allLessons,
    } = await req.json();

    if (!pupilEmail || !instructorId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch instructor details
    const { data: instructor, error: instrError } = await supabase
      .from("instructors")
      .select("name, phone, email, vehicle_type, transmission, slug, profile_image_url, commission_payer, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays")
      .eq("id", instructorId)
      .single();

    if (instrError || !instructor) {
      console.error("Failed to fetch instructor:", instrError);
      return new Response(
        JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentQrUrl = getActivePaymentQrUrl(instructor);

    const html = buildEmailHtml({
      pupilName: pupilName || "there",
      instructorName: instructor.name || "Your Instructor",
      instructorPhone: instructor.phone,
      instructorEmail: instructor.email,
      vehicleType: instructor.vehicle_type,
      transmission: instructor.transmission,
      profileImageUrl: instructor.profile_image_url,
      slug: instructor.slug,
      paymentQrUrl,
      firstLessonDate,
      firstLessonTime,
      pickupAddress,
      courseType: courseType || "Driving Course",
      courseHours: courseHours || 0,
      allLessons,
    });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    const emailResult = await resend.emails.send({
      from: "EveryDriver <noreply@everydriver.co.uk>",
      to: [pupilEmail],
      subject: `Welcome! Your driving lessons with ${instructor.name || "your instructor"} are confirmed`,
      html,
    });

    console.log("Welcome email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
