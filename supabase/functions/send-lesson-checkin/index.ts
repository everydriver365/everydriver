import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find lessons happening tomorrow that haven't been sent a check-in yet
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: lessons, error } = await supabase
      .from("scheduled_lessons")
      .select(`
        id, lesson_date, start_time, duration_minutes, instructor_id,
        pupil:pupils(id, name, phone, instructor_id)
      `)
      .eq("lesson_date", tomorrowStr)
      .eq("status", "scheduled")
      .is("check_in_sent_at", null)
      .is("deleted_at", null);

    if (error) throw error;

    let sentCount = 0;

    for (const lesson of lessons || []) {
      // Mark check-in as sent
      await supabase
        .from("scheduled_lessons")
        .update({ check_in_sent_at: new Date().toISOString() })
        .eq("id", lesson.id);

      // Send push notification to pupil
      const pupil = lesson.pupil as any;
      if (pupil?.id) {
        // Look up pupil push subscriptions
        const { data: subs } = await supabase
          .from("pupil_push_subscriptions")
          .select("*")
          .eq("pupil_id", pupil.id);

        if (subs && subs.length > 0) {
          // Send via the existing push notification infrastructure
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                instructorId: lesson.instructor_id,
                notification: {
                  title: "Lesson Tomorrow - Please Confirm",
                  body: `You have a lesson at ${lesson.start_time} tomorrow. Tap to confirm attendance.`,
                  tag: `checkin-${lesson.id}`,
                  data: { type: "lesson_checkin", lessonId: lesson.id },
                  actions: [
                    { action: "confirm", title: "I'll be there" },
                    { action: "decline", title: "Can't make it" },
                  ],
                  requireInteraction: true,
                },
              }),
            });
          } catch (pushErr) {
            console.error("Push send error:", pushErr);
          }
        }
      }

      sentCount++;
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
