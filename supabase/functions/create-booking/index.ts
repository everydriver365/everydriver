import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

interface BookingRequest {
  instructorId: string;
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  pupilAddress: string;
  pupilPostcode: string;
  courseType: string;
  courseHours: number;
  totalPrice: number;
  slots: BookingSlot[];
  // Deposit payment fields
  paymentType?: 'full' | 'deposit';
  amountPaid?: number;
  depositAmount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const booking: BookingRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine payment type and amounts
    const paymentType = booking.paymentType || 'full';
    const amountPaid = booking.amountPaid || (paymentType === 'full' ? booking.totalPrice : booking.depositAmount || 0);
    const remainingBalance = booking.totalPrice - amountPaid;

    // Calculate balance due date (30 days before first lesson)
    let balanceDueDate: string | null = null;
    if (paymentType === 'deposit' && booking.slots.length > 0) {
      const sortedSlots = [...booking.slots].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const firstLessonDate = new Date(sortedSlots[0].date);
      const dueDate = new Date(firstLessonDate);
      dueDate.setDate(dueDate.getDate() - 30);
      balanceDueDate = dueDate.toISOString().split('T')[0];
    }

    // 1. Create the pupil record
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .insert({
        instructor_id: booking.instructorId,
        name: booking.pupilName,
        email: booking.pupilEmail,
        phone: booking.pupilPhone,
        address: booking.pupilAddress,
        postcode: booking.pupilPostcode,
        course_type: booking.courseType,
        prepaid_hours: booking.courseHours,
        account_balance: -remainingBalance, // Negative = amount owed (0 if paid in full)
        progress: 0,
        lessons_completed: 0,
        // Deposit tracking fields
        payment_type: paymentType,
        deposit_paid: paymentType === 'deposit' ? amountPaid : 0,
        balance_due_date: balanceDueDate,
        deposit_forfeited: false,
      })
      .select()
      .single();

    if (pupilError) {
      console.error("Error creating pupil:", pupilError);
      return new Response(
        JSON.stringify({ error: "Failed to create pupil record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create scheduled lessons for each slot
    const lessonInserts = booking.slots.map((slot) => ({
      instructor_id: booking.instructorId,
      pupil_id: pupil.id,
      lesson_date: slot.date,
      start_time: slot.startTime,
      duration_minutes: slot.duration,
      pickup_location: booking.pupilAddress,
      pickup_postcode: booking.pupilPostcode,
      lesson_type: "driving",
      status: "scheduled",
      payment_status: "pending",
    }));

    const { data: lessons, error: lessonsError } = await supabase
      .from("scheduled_lessons")
      .insert(lessonInserts)
      .select();

    if (lessonsError) {
      console.error("Error creating lessons:", lessonsError);
      // Rollback pupil creation
      await supabase.from("pupils").delete().eq("id", pupil.id);
      return new Response(
        JSON.stringify({ error: "Failed to create lesson schedule" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update pupil with next lesson date
    const sortedLessons = lessons?.sort((a, b) => 
      new Date(`${a.lesson_date}T${a.start_time}`).getTime() - 
      new Date(`${b.lesson_date}T${b.start_time}`).getTime()
    );

    if (sortedLessons && sortedLessons.length > 0) {
      const nextLesson = sortedLessons[0];
      await supabase
        .from("pupils")
        .update({ next_lesson: nextLesson.lesson_date })
        .eq("id", pupil.id);
    }

    // 4. Notify instructor of new booking via SMS
    try {
      const firstLesson = sortedLessons?.[0];
      if (firstLesson) {
        const notifyResponse = await fetch(
          `${supabaseUrl}/functions/v1/notify-instructor`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              instructorId: booking.instructorId,
              type: "new_booking",
              pupilName: booking.pupilName,
              lessonDate: firstLesson.lesson_date,
              lessonTime: firstLesson.start_time,
              durationMinutes: firstLesson.duration_minutes,
            }),
          }
        );
        console.log("Instructor notification result:", await notifyResponse.json());
      }
    } catch (notifyError) {
      console.error("Instructor notification error (non-fatal):", notifyError);
    }

    // 5. Sync lessons to Google Calendar (if connected)
    try {
      const calendarLessons = lessons?.map((lesson) => ({
        lessonId: lesson.id,
        date: lesson.lesson_date,
        startTime: lesson.start_time,
        pupilName: booking.pupilName,
        pickupLocation: booking.pupilAddress,
        duration: lesson.duration_minutes,
      }));

      // Call the calendar sync function
      const syncResponse = await fetch(
        `${supabaseUrl}/functions/v1/google-calendar-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: "syncLessons",
            instructorId: booking.instructorId,
            lessons: calendarLessons,
          }),
        }
      );

      const syncResult = await syncResponse.json();
      console.log("Calendar sync result:", syncResult);
    } catch (calendarError) {
      // Log but don't fail the booking if calendar sync fails
      console.error("Calendar sync error (non-fatal):", calendarError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pupilId: pupil.id,
        lessonsCreated: lessons?.length || 0,
        message: `Booking confirmed! ${lessons?.length || 0} lessons scheduled.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Booking error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
