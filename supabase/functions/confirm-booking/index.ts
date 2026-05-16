import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { syncLessonNow } from "../_shared/googleCalendarSync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConfirmBookingRequest {
  pupilId: string;
  instructorId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupilId, instructorId }: ConfirmBookingRequest = await req.json();

    if (!pupilId || !instructorId) {
      return new Response(
        JSON.stringify({ error: "pupilId and instructorId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pupil details
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .select("id, name, email, phone, address, postcode, course_type, prepaid_hours, pickup_address")
      .eq("id", pupilId)
      .single();

    if (pupilError || !pupil) {
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all scheduled lessons for this pupil
    const { data: lessons } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time, duration_minutes")
      .eq("pupil_id", pupilId)
      .eq("instructor_id", instructorId)
      .order("lesson_date", { ascending: true })
      .order("start_time", { ascending: true });

    const sortedLessons = lessons || [];

    const allLessons = sortedLessons.map((l: any) => ({
      date: l.lesson_date,
      time: l.start_time,
      durationMinutes: l.duration_minutes,
    }));

    // 1. Notify instructor of new booking
    try {
      if (sortedLessons.length > 0) {
        const notifyResponse = await fetch(
          `${supabaseUrl}/functions/v1/notify-instructor`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              instructorId,
              type: "new_booking",
              pupilName: pupil.name,
              lessonDate: sortedLessons[0].lesson_date,
              lessonTime: sortedLessons[0].start_time,
              durationMinutes: sortedLessons[0].duration_minutes,
              allLessons,
            }),
          }
        );
        console.log("Instructor notification result:", await notifyResponse.json());
      }
    } catch (notifyError) {
      console.error("Instructor notification error (non-fatal):", notifyError);
    }

    // 2. Sync lessons to Google Calendar — payment has just succeeded, so
    //    clear the "awaiting initial payment" hold and push every lesson to
    //    Google synchronously. Money is already captured at this point, so a
    //    Google failure does NOT roll back the booking; instead we mark the
    //    failed lessons, enqueue a retry via the existing queue, and surface
    //    a soft warning to the caller so the instructor can be alerted.
    const calendarFailures: { lessonId: string; error: string }[] = [];
    try {
      const { error: clearErr } = await supabase
        .from("scheduled_lessons")
        .update({ awaiting_initial_payment: false })
        .eq("pupil_id", pupilId)
        .eq("awaiting_initial_payment", true);
      if (clearErr) {
        console.error("Failed to clear awaiting_initial_payment flag:", clearErr);
      }

      for (const l of sortedLessons) {
        try {
          await syncLessonNow(supabase, l.id);
        } catch (syncErr) {
          const message = syncErr instanceof Error ? syncErr.message : "Unknown sync error";
          console.error(`Calendar sync failed for lesson ${l.id}:`, message);
          calendarFailures.push({ lessonId: l.id, error: message });
          await supabase
            .from("scheduled_lessons")
            .update({ calendar_sync_status: "failed" })
            .eq("id", l.id);
          // Enqueue a retry so the cron picks it up.
          await supabase
            .from("calendar_sync_queue")
            .insert({ instructor_id: instructorId, lesson_id: l.id, action: "syncLesson" });
        }
      }
    } catch (calendarError) {
      console.error("Calendar sync block error (non-fatal):", calendarError);
    }

    if (calendarFailures.length > 0) {
      // Alert the instructor — non-fatal if this fails too.
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify-instructor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            instructorId,
            type: "calendar_sync_failed",
            pupilName: pupil.name,
            message: `Booking confirmed for ${pupil.name} but ${calendarFailures.length} lesson${calendarFailures.length === 1 ? "" : "s"} couldn't be added to Google Calendar. We'll keep retrying — please check your Google connection in Settings → Integrations.`,
          }),
        });
      } catch (alertErr) {
        console.error("Calendar-failure alert error (non-fatal):", alertErr);
      }
    }

    // 3. Send pupil welcome/onboarding email
    try {
      const firstLesson = sortedLessons[0];
      await fetch(
        `${supabaseUrl}/functions/v1/send-pupil-welcome`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            pupilId: pupil.id,
            pupilName: pupil.name,
            pupilEmail: pupil.email,
            pupilPhone: pupil.phone,
            instructorId,
            courseType: pupil.course_type,
            courseHours: pupil.prepaid_hours,
            firstLessonDate: firstLesson?.lesson_date || null,
            firstLessonTime: firstLesson?.start_time || null,
            pickupAddress: pupil.pickup_address || pupil.address,
            allLessons,
          }),
        }
      );
      console.log("Pupil welcome email triggered");
    } catch (welcomeError) {
      console.error("Welcome email error (non-fatal):", welcomeError);
    }

    // 4. Notify parent (if linked)
    try {
      await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          pupilId: pupil.id,
          type: "booking_confirmed",
          body: `A ${pupil.course_type || "driving"} course (${pupil.prepaid_hours || 0} hours) has been booked for ${pupil.name}.${sortedLessons[0] ? ` First lesson: ${sortedLessons[0].lesson_date}` : ""}`,
        }),
      });
      console.log("Parent notification triggered");
    } catch (parentError) {
      console.error("Parent notification error (non-fatal):", parentError);
    }

    // 5. Send upsell notification emails
    try {
      const { data: pupilUpsells } = await supabase
        .from("pupil_upsells")
        .select("upsell_id, amount_paid, booking_upsells:upsell_id(name, price)")
        .eq("pupil_id", pupilId);

      if (pupilUpsells && pupilUpsells.length > 0) {
        for (const pu of pupilUpsells) {
          const upsellName = (pu as any).booking_upsells?.name || "Add-on";
          const upsellPrice = pu.amount_paid || 0;
          await fetch(
            `${supabaseUrl}/functions/v1/notify-upsell-purchase`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                pupilName: pupil.name,
                pupilEmail: pupil.email,
                pupilPhone: pupil.phone,
                upsellName,
                upsellPrice,
                instructorId,
                pupilId: pupil.id,
                firstLessonDate: sortedLessons[0]?.lesson_date,
              }),
            }
          );
        }
        console.log("Upsell notification emails sent");
      }
    } catch (upsellError) {
      console.error("Upsell notification error (non-fatal):", upsellError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking confirmed and notifications sent",
        calendarSyncFailed: calendarFailures.length > 0,
        lessonsFailed: calendarFailures.map((f) => f.lessonId),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Confirm booking error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
