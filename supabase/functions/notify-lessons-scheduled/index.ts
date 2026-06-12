import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonInfo { date: string; time: string; duration: number }
interface NotifyRequest { pupilId: string; instructorId: string; lessons: LessonInfo[] }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pupilId, instructorId, lessons }: NotifyRequest = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [pupilResult, instructorResult] = await Promise.all([
      supabase.from("pupils").select("name, email, phone").eq("id", pupilId).single(),
      supabase.from("instructors").select("name, phone, email").eq("id", instructorId).single(),
    ]);

    if (pupilResult.error || !pupilResult.data) {
      return new Response(JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pupil = pupilResult.data;
    const instructor = instructorResult.data;

    const lessonLines = lessons.map((l) => {
      const date = new Date(l.date);
      const formattedDate = date.toLocaleDateString("en-GB",
        { weekday: "long", day: "numeric", month: "long" });
      return `• ${formattedDate} at ${l.time} (${l.duration}h)`;
    });

    if (pupil.email) {
      await sendBrandedEmail({
        to: pupil.email,
        subject: "Your Driving Lessons Are Scheduled! 🚗",
        heading: "Your lessons have been scheduled",
        intro: `Hi ${pupil.name}, your driving lessons with ${instructor?.name || "your instructor"} are now booked.`,
        paragraphs: [
          lessonLines.join("\n"),
          "Please be ready at your pickup location 5 minutes early, bring your provisional driving licence, and wear comfortable shoes suitable for driving.",
          "If you need to reschedule any lessons, please contact your instructor as soon as possible.",
        ],
        signOff: `See you soon!\n${instructor?.name || "Your Instructor"}`,
        idempotencyKey: `lessons-scheduled-${pupilId}-${Date.now()}`,
      }, supabase);
    }

    // SMS (unchanged)
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (twilioAccountSid && twilioAuthToken && twilioPhone && pupil.phone) {
      try {
        const smsBody = `Hi ${pupil.name}! Your driving lessons have been scheduled:\n\n${lessonLines.join("\n")}\n\nSee you soon! - ${instructor?.name || "Your Instructor"}`;
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ To: pupil.phone, From: twilioPhone, Body: smsBody }),
          },
        );
      } catch (e) { console.error("SMS error (non-fatal):", e); }
    }

    return new Response(JSON.stringify({
      success: true, message: "Notifications sent", lessonsScheduled: lessons.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
