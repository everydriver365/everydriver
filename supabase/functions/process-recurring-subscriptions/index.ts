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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active subscriptions where next_lesson_date is within 7 days
    const today = new Date();
    const weekAhead = new Date(today);
    weekAhead.setDate(weekAhead.getDate() + 7);
    const todayStr = today.toISOString().split("T")[0];
    const weekAheadStr = weekAhead.toISOString().split("T")[0];

    const { data: subscriptions, error: subError } = await supabase
      .from("pupil_subscriptions")
      .select("*, pupils(name), instructors(name)")
      .eq("status", "active")
      .lte("next_lesson_date", weekAheadStr);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No subscriptions due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let created = 0;
    let skipped = 0;

    for (const sub of subscriptions) {
      if (!sub.next_lesson_date) continue;

      // Check for instructor date overrides (holidays) on next_lesson_date
      const { data: overrides } = await supabase
        .from("instructor_date_overrides")
        .select("id")
        .eq("instructor_id", sub.instructor_id)
        .eq("override_date", sub.next_lesson_date)
        .eq("is_available", false)
        .limit(1);

      if (overrides && overrides.length > 0) {
        // Skip this date (holiday), advance by 7 days
        const nextDate = new Date(sub.next_lesson_date);
        nextDate.setDate(nextDate.getDate() + 7);
        await supabase
          .from("pupil_subscriptions")
          .update({ next_lesson_date: nextDate.toISOString().split("T")[0] })
          .eq("id", sub.id);
        skipped++;
        continue;
      }

      // Check if lesson already exists for this date/time/pupil
      const { data: existing } = await supabase
        .from("scheduled_lessons")
        .select("id")
        .eq("instructor_id", sub.instructor_id)
        .eq("pupil_id", sub.pupil_id)
        .eq("lesson_date", sub.next_lesson_date)
        .eq("start_time", sub.start_time)
        .limit(1);

      if (existing && existing.length > 0) {
        // Already created, advance date
        const nextDate = new Date(sub.next_lesson_date);
        nextDate.setDate(nextDate.getDate() + 7);
        await supabase
          .from("pupil_subscriptions")
          .update({ next_lesson_date: nextDate.toISOString().split("T")[0] })
          .eq("id", sub.id);
        skipped++;
        continue;
      }

      // Create the lesson
      const { error: lessonError } = await supabase
        .from("scheduled_lessons")
        .insert({
          instructor_id: sub.instructor_id,
          pupil_id: sub.pupil_id,
          lesson_date: sub.next_lesson_date,
          start_time: sub.start_time,
          duration_minutes: sub.duration_minutes,
          pickup_postcode: sub.pickup_postcode,
          pickup_address: sub.pickup_address,
          price: sub.price_per_lesson,
          status: "scheduled",
          notes: "Auto-created from recurring subscription",
        });

      if (lessonError) {
        console.error(`Failed to create lesson for sub ${sub.id}:`, lessonError);
        continue;
      }

      // Advance next_lesson_date by 7 days
      const nextDate = new Date(sub.next_lesson_date);
      nextDate.setDate(nextDate.getDate() + 7);
      await supabase
        .from("pupil_subscriptions")
        .update({ next_lesson_date: nextDate.toISOString().split("T")[0] })
        .eq("id", sub.id);

      created++;
    }

    return new Response(
      JSON.stringify({ processed: subscriptions.length, created, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-recurring-subscriptions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
