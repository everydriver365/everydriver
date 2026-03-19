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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Get all scheduled lessons for tomorrow that don't have reminders yet
    const { data: lessons } = await supabase
      .from("scheduled_lessons")
      .select("id, instructor_id, pupil_id, lesson_date, start_time")
      .eq("lesson_date", tomorrowStr)
      .eq("status", "scheduled");

    if (!lessons?.length) {
      return new Response(JSON.stringify({ scheduled: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing reminders to avoid duplicates
    const lessonIds = lessons.map((l) => l.id);
    const { data: existingReminders } = await supabase
      .from("lesson_reminders")
      .select("lesson_id, reminder_type")
      .in("lesson_id", lessonIds);

    const existingSet = new Set(
      (existingReminders || []).map((r) => `${r.lesson_id}-${r.reminder_type}`)
    );

    const remindersToInsert: any[] = [];

    for (const lesson of lessons) {
      const lessonDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time || "09:00:00"}`);

      // 24h reminder (send evening before)
      if (!existingSet.has(`${lesson.id}-24h`)) {
        const reminderTime = new Date(lessonDateTime);
        reminderTime.setHours(reminderTime.getHours() - 24);
        // Don't schedule in the past
        if (reminderTime > now) {
          remindersToInsert.push({
            lesson_id: lesson.id,
            instructor_id: lesson.instructor_id,
            pupil_id: lesson.pupil_id,
            reminder_type: "24h",
            channel: "sms",
            scheduled_for: reminderTime.toISOString(),
          });
        }
      }

      // 1h reminder
      if (!existingSet.has(`${lesson.id}-1h`)) {
        const reminderTime = new Date(lessonDateTime);
        reminderTime.setHours(reminderTime.getHours() - 1);
        if (reminderTime > now) {
          remindersToInsert.push({
            lesson_id: lesson.id,
            instructor_id: lesson.instructor_id,
            pupil_id: lesson.pupil_id,
            reminder_type: "1h",
            channel: "sms",
            scheduled_for: reminderTime.toISOString(),
          });
        }
      }
    }

    if (remindersToInsert.length > 0) {
      await supabase.from("lesson_reminders").insert(remindersToInsert);
    }

    return new Response(JSON.stringify({ scheduled: remindersToInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Schedule reminders error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
