import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lessons scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`Fetching lessons for ${tomorrowStr}`);

    const { data: lessons, error: lessonsError } = await supabase
      .from("scheduled_lessons")
      .select(`
        id,
        lesson_date,
        start_time,
        duration_minutes,
        pickup_location,
        pupil_id,
        instructor_id,
        pupils (
          name,
          phone
        ),
        instructors (
          name,
          phone
        )
      `)
      .eq("lesson_date", tomorrowStr)
      .eq("status", "confirmed")
      .neq("status", "cancelled");

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} lessons for tomorrow`);

    const results = {
      totalLessons: lessons?.length || 0,
      smsSent: 0,
      smsSkipped: 0,
      errors: [] as string[],
    };

    for (const lesson of lessons || []) {
      const pupil = Array.isArray(lesson.pupils) ? lesson.pupils[0] : lesson.pupils;
      const instructor = Array.isArray(lesson.instructors) ? lesson.instructors[0] : lesson.instructors;

      if (!pupil?.phone) {
        console.log(`Skipping lesson ${lesson.id} - no pupil phone`);
        results.smsSkipped++;
        continue;
      }

      const formatTime = (time: string) => {
        const [h, m] = time.slice(0, 5).split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "pm" : "am";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${m}${ampm}`;
      };

      const message = `Hi ${pupil.name}! 🚗 Reminder: Your driving lesson is tomorrow at ${formatTime(lesson.start_time)} with ${instructor?.name || "your instructor"}. Pickup: ${lesson.pickup_location || "As arranged"}. Duration: ${lesson.duration_minutes} mins. See you then!`;

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
              To: pupil.phone,
              From: twilioPhoneNumber,
              Body: message,
            }),
          }
        );

        if (response.ok) {
          console.log(`SMS sent to ${pupil.name} for lesson ${lesson.id}`);
          results.smsSent++;
        } else {
          const errorData = await response.json();
          console.error(`Failed to send SMS for lesson ${lesson.id}:`, errorData);
          results.errors.push(`Lesson ${lesson.id}: ${errorData.message || "Unknown error"}`);
        }
      } catch (smsError) {
        console.error(`Error sending SMS for lesson ${lesson.id}:`, smsError);
        results.errors.push(`Lesson ${lesson.id}: ${smsError instanceof Error ? smsError.message : "Unknown error"}`);
      }
    }

    console.log("Lesson reminders complete:", results);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-lesson-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
