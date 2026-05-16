import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z } from "https://esm.sh/zod@3.25.76";
import {
  buildDayConflicts,
  validateSlot,
  toMinutes as engineToMin,
  describeReason,
} from "../_shared/availabilityEngine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const bookingSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format"),
  duration: z.number().int().min(15).max(600),
  // Optional pricing snapshot captured at checkout (per-hour rate already
  // including postcode override + surcharge, plus the £/hr surcharge portion).
  pricePerHour: z.number().min(0).max(10000).optional(),
  surchargeAmount: z.number().min(0).max(10000).optional(),
  amountDue: z.number().min(0).max(100000).optional(),
});

const bookingSchema = z.object({
  instructorId: z.string().uuid("Invalid instructor ID"),
  pupilName: z.string().trim().min(1, "Name is required").max(200),
  pupilEmail: z.string().trim().email("Invalid email").max(255),
  pupilPhone: z.string().trim().min(1, "Phone is required").max(30),
  pupilAddress: z.string().trim().min(1, "Address is required").max(500),
  pupilPostcode: z.string().trim().min(1, "Postcode is required").max(20),
  pickupAddress: z.string().trim().max(500).optional(),
  pickupPostcode: z.string().trim().max(20).optional(),
  pickupWhat3words: z.string().trim().max(100).optional(),
  specialNeeds: z.string().trim().max(1000).optional(),
  courseType: z.string().trim().min(1).max(100),
  courseHours: z.number().min(1).max(200),
  totalPrice: z.number().min(0).max(100000),
  platformFee: z.number().min(0).max(100).optional(),
  slots: z.array(bookingSlotSchema).max(100).default([]),
  paymentType: z.enum(['full', 'deposit']).optional(),
  amountPaid: z.number().min(0).max(100000).optional(),
  depositAmount: z.number().min(0).max(100000).optional(),
  upsells: z.array(z.object({
    id: z.string().uuid(),
    price: z.number().min(0).max(10000),
  })).optional(),
  skipNotifications: z.boolean().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parseResult = bookingSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const booking = parseResult.data;
    // Default: skip notifications (caller must invoke confirm-booking separately after payment)
    const skipNotifications = booking.skipNotifications !== false;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Server-side availability re-validation ──────────────────────────────
    // Re-runs the same checks the public search does (working hours, date
    // overrides, scheduled lessons, manual blocks, busy calendar events,
    // instructor buffer) at booking time. Live data only — if working hours
    // aren't configured for the requested day, the booking is rejected.
    if (booking.slots.length > 0) {
      const toMin = (t: string) => engineToMin(t);
      const dates = Array.from(new Set(booking.slots.map((s) => s.date))).sort();
      const fromYmd = dates[0];
      const toYmd = dates[dates.length - 1];
      const fromIso = new Date(`${fromYmd}T00:00:00Z`).toISOString();
      const toIso = new Date(`${toYmd}T23:59:59Z`).toISOString();

      const [whRes, ovRes, lessonRes, blockRes, evRes, instRes] = await Promise.all([
        supabase
          .from("instructor_working_hours")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", booking.instructorId)
          .eq("is_active", true),
        supabase
          .from("instructor_date_overrides")
          .select("override_date, is_available, start_time, end_time")
          .eq("instructor_id", booking.instructorId)
          .gte("override_date", fromYmd)
          .lte("override_date", toYmd),
        supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes")
          .eq("instructor_id", booking.instructorId)
          .gte("lesson_date", fromYmd)
          .lte("lesson_date", toYmd)
          .neq("status", "cancelled")
          .is("deleted_at", null),
        supabase
          .from("instructor_manual_blocks")
          .select("start_datetime, end_datetime")
          .eq("instructor_id", booking.instructorId)
          .gte("end_datetime", fromIso)
          .lte("start_datetime", toIso),
        supabase
          .from("instructor_calendar_events")
          .select("start_time, end_time, is_busy")
          .eq("instructor_id", booking.instructorId)
          .eq("is_busy", true)
          .gte("end_time", fromIso)
          .lte("start_time", toIso),
        supabase
          .from("instructors")
          .select("buffer_minutes")
          .eq("id", booking.instructorId)
          .maybeSingle(),
      ]);

      const buffer = Number(instRes.data?.buffer_minutes ?? 0);
      const conflicts: { date: string; startTime: string; reason: string }[] = [];

      // Group conflict sources by date once — engine handles clipping &
      // the all-day Google rule, so we don't duplicate the logic here.
      const lessonsByDate = new Map<string, any[]>();
      for (const l of (lessonRes.data || [])) {
        const arr = lessonsByDate.get(l.lesson_date) || [];
        arr.push(l);
        lessonsByDate.set(l.lesson_date, arr);
      }

      for (const slot of booking.slots) {
        const slotStart = toMin(slot.startTime);
        const slotEnd = toMin(slot.endTime);
        const dow = new Date(`${slot.date}T00:00:00Z`).getUTCDay();
        const override = (ovRes.data || []).find((o) => o.override_date === slot.date);

        // Determine working window (override wins).
        let windowStart: number | null = null;
        let windowEnd: number | null = null;
        if (override) {
          if (!override.is_available) {
            conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Date marked unavailable by instructor" });
            continue;
          }
          if (override.start_time && override.end_time) {
            windowStart = toMin(override.start_time);
            windowEnd = toMin(override.end_time);
          }
        }
        if (windowStart == null) {
          const wh = (whRes.data || []).filter((w) => w.day_of_week === dow);
          if (wh.length === 0) {
            conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Instructor has no working hours configured for this day" });
            continue;
          }
          const fitting = wh.find((w) => slotStart >= toMin(w.start_time) && slotEnd <= toMin(w.end_time));
          if (!fitting) {
            conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Outside instructor working hours" });
            continue;
          }
          windowStart = toMin(fitting.start_time);
          windowEnd = toMin(fitting.end_time);
        } else if (slotStart < windowStart || slotEnd > windowEnd!) {
          conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Outside instructor working hours for this date" });
          continue;
        }

        // Build the conflict list via the shared engine (drops Google all-day
        // events, clips multi-day blocks, etc.) — IDENTICAL rules to the UI.
        const dayConflicts = buildDayConflicts(
          slot.date,
          (lessonsByDate.get(slot.date) || []).map((l: any) => ({
            start_time: l.start_time,
            duration_minutes: Number(l.duration_minutes || 60),
          })),
          (blockRes.data || []).map((b: any) => ({
            start_datetime: b.start_datetime,
            end_datetime: b.end_datetime,
          })),
          (evRes.data || []).map((e: any) => ({
            start_time: e.start_time,
            end_time: e.end_time,
            is_busy: e.is_busy,
          })),
        );

        const result = validateSlot({
          startMin: slotStart,
          durationMinutes: slotEnd - slotStart,
          dayStartMin: windowStart!,
          dayEndMin: windowEnd!,
          bufferMinutes: buffer,
          conflicts: dayConflicts,
        });

        if (!result.ok) {
          conflicts.push({
            date: slot.date,
            startTime: slot.startTime,
            reason: describeReason(result.reason),
          });
        }
      }

      if (conflicts.length > 0) {
        return new Response(
          JSON.stringify({
            error: "SLOT_UNAVAILABLE",
            fallback: true,
            message: "One or more requested slots are no longer available",
            conflicts,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
        pickup_address: booking.pickupAddress || null,
        pickup_postcode: booking.pickupPostcode || null,
        what3words: booking.pickupWhat3words || null,
        special_needs: booking.specialNeeds || null,
        course_type: booking.courseType,
        prepaid_hours: booking.courseHours,
        account_balance: -remainingBalance,
        progress: 0,
        lessons_completed: 0,
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

    // 2. Create scheduled lessons for each slot (if any provided)
    let lessons: any[] = [];
    if (booking.slots.length > 0) {
      // Hold lessons off Google Calendar until payment is actually received.
      // Public-flow bookings always reach create-booking BEFORE the payment
      // gateway confirms — so we mark every paid booking as pending and let
      // confirm-booking / the payment webhooks clear the flag once the money
      // has actually moved. Only £0 bookings sync immediately.
      const awaitingInitialPayment = booking.totalPrice > 0;

      const lessonInserts = booking.slots.map((slot) => ({
        instructor_id: booking.instructorId,
        pupil_id: pupil.id,
        lesson_date: slot.date,
        start_time: slot.startTime,
        duration_minutes: slot.duration,
        pickup_location: booking.pickupAddress || booking.pupilAddress,
        pickup_postcode: booking.pickupPostcode || booking.pupilPostcode,
        lesson_type: "driving",
        status: "scheduled",
        payment_status: "pending",
        awaiting_initial_payment: awaitingInitialPayment,
        // Pricing snapshot at booking — preserves the rate paid even if the
        // instructor later changes their hourly rate or surcharges.
        ...(slot.pricePerHour != null ? { price_per_hour: slot.pricePerHour } : {}),
        ...(slot.surchargeAmount != null ? { surcharge_amount: slot.surchargeAmount } : {}),
        ...(slot.amountDue != null ? { amount_due: slot.amountDue } : {}),
      }));

      const { data: lessonData, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .insert(lessonInserts)
        .select();

      if (lessonsError) {
        console.error("Error creating lessons:", lessonsError);
        await supabase.from("pupils").delete().eq("id", pupil.id);
        return new Response(
          JSON.stringify({ error: "Failed to create lesson schedule" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      lessons = lessonData || [];
    }

    // 3. Save purchased upsells
    if (booking.upsells && booking.upsells.length > 0) {
      const upsellInserts = booking.upsells.map((u) => ({
        pupil_id: pupil.id,
        upsell_id: u.id,
        amount_paid: u.price,
        status: 'pending',
      }));

      const { error: upsellError } = await supabase
        .from("pupil_upsells")
        .insert(upsellInserts);

      if (upsellError) {
        console.error("Error saving upsells (non-fatal):", upsellError);
      }
    }

    // 4. Update pupil with next lesson date
    const sortedLessons = lessons?.sort((a: any, b: any) =>
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

    // 5. Record platform fee (£1 per booking) — separate from school skim & Service Fee
    const platformFeeAmount = booking.platformFee ?? 0;
    if (platformFeeAmount > 0) {
      try {
        await supabase.from("platform_fees").insert({
          pupil_id: pupil.id,
          instructor_id: booking.instructorId,
          amount: platformFeeAmount,
          currency: "GBP",
          source: "booking",
          notes: `Booking: ${booking.courseType} (${booking.courseHours}h)`,
        });
      } catch (feeErr) {
        console.error("Platform fee record error (non-fatal):", feeErr);
      }
    }

    // 6. Record payment_history for free bookings (amount=0)
    if (booking.totalPrice === 0) {
      try {
        await supabase.from("payment_history").insert({
          instructor_id: booking.instructorId,
          pupil_id: pupil.id,
          amount: 0,
          payment_method: "Free",
          notes: `Free booking: ${booking.courseType}`,
        });
        console.log("Free booking payment_history recorded");
      } catch (freePayError) {
        console.error("Free booking payment record error (non-fatal):", freePayError);
      }
    }

    // 6. Only send notifications if explicitly requested (skipNotifications=false)
    // This is used for free bookings where no separate payment step exists
    if (!skipNotifications) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/confirm-booking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            pupilId: pupil.id,
            instructorId: booking.instructorId,
          }),
        });
        console.log("Confirm-booking notifications triggered inline");
      } catch (confirmError) {
        console.error("Confirm-booking inline error (non-fatal):", confirmError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pupilId: pupil.id,
        lessonsCreated: lessons?.length || 0,
        message: `Booking created! ${lessons?.length || 0} lessons scheduled.`,
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
