import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  instructorId: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  originalLessonId?: string;
}

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const getTimeSlot = (time: string): string => {
  const hour = parseInt(time.split(":")[0]);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      instructorId,
      lessonDate,
      startTime,
      endTime,
      durationMins,
    }: ProcessRequest = await req.json();

    // Toggle gate
    const { data: instructorToggle } = await supabase
      .from("instructors")
      .select("ai_waitlist_filling_enabled")
      .eq("id", instructorId)
      .maybeSingle();
    if (instructorToggle && instructorToggle.ai_waitlist_filling_enabled === false) {
      console.log(`Waitlist filling disabled for instructor ${instructorId} — skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, offersCreated: 0, reason: "ai_waitlist_filling_enabled is false" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      lessonDate: _ld,
      startTime: _st,
      endTime: _et,
      durationMins: _dm,
      originalLessonId,
    }: ProcessRequest = await req.json();

    // Get the day of week from the lesson date
    const date = new Date(lessonDate);
    const dayOfWeek = DAY_MAP[date.getDay()];
    const timeSlot = getTimeSlot(startTime);

    // Fetch active waitlist entries for this instructor
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("lesson_waitlist")
      .select(`
        *,
        pupil:pupils(id, name, phone)
      `)
      .eq("instructor_id", instructorId)
      .eq("is_active", true);

    if (waitlistError) {
      throw waitlistError;
    }

    // Filter entries that match the slot criteria
    const matchingEntries = (waitlistEntries || []).filter((entry: any) => {
      // Check if day matches (empty array means any day is OK)
      const dayMatches =
        !entry.preferred_days?.length || entry.preferred_days.includes(dayOfWeek);

      // Check if time slot matches (empty array means any time is OK)
      const timeMatches =
        !entry.preferred_times?.length || entry.preferred_times.includes(timeSlot);

      // Check if duration is within range
      const durationMatches =
        durationMins >= (entry.min_duration_mins || 60) &&
        durationMins <= (entry.max_duration_mins || 180);

      return dayMatches && timeMatches && durationMatches;
    });

    if (matchingEntries.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No matching waitlist entries found",
          offersCreated: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create slot offers for each matching pupil (not yet approved by instructor)
    const offers = matchingEntries.map((entry: any) => ({
      instructor_id: instructorId,
      pupil_id: entry.pupil_id,
      original_lesson_id: originalLessonId || null,
      lesson_date: lessonDate,
      start_time: startTime,
      end_time: endTime,
      duration_mins: durationMins,
      instructor_approved: false,
      pupil_response: "pending",
    }));

    const { error: insertError } = await supabase.from("slot_offers").insert(offers);

    if (insertError) {
      throw insertError;
    }

    // Get instructor details for notification
    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, phone")
      .eq("id", instructorId)
      .single();

    // Notify instructor about pending offers via push notification
    fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        instructorId,
        notification: {
          title: "Waitlist Matches Found 👥",
          body: `${matchingEntries.length} pupil${matchingEntries.length > 1 ? "s" : ""} match the cancelled slot. Review and approve offers.`,
          tag: "waitlist-match",
          data: { url: "/instructor/gaps" },
        },
      }),
    }).catch((e) => console.error("Push notification failed (non-fatal):", e));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${matchingEntries.length} slot offers pending approval`,
        offersCreated: matchingEntries.length,
        pupils: matchingEntries.map((e: any) => e.pupil?.name || "Unknown"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing cancellation waitlist:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
