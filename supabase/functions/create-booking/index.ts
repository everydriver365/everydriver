// =============================================================================
// create-booking/index.ts
// =============================================================================
//
// Deploy as: supabase/functions/create-booking/index.ts
//
// Creates a pupil record + scheduled lesson rows, then either pushes to
// Google Calendar immediately (£0 bookings) or marks rows as
// awaiting_initial_payment=true (paid bookings — calendar push happens in
// confirm-booking after payment succeeds).
//
// Server-side availability guard runs the SAME engine as the browser
// (imported from _shared/availabilityEngine.ts) so it can never accept a
// slot the UI should have rejected, and vice-versa.
// =============================================================================

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z }            from "https://esm.sh/zod@3.25.76";
import {
  buildDayConflicts,
  validateSlot,
  toMinutes,
  describeReason,
} from "../_shared/availabilityEngine.ts";  // Deno copy — identical logic
import { syncLessonNow } from "../_shared/googleCalendarSync.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const slotSchema = z.object({
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:    z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime:      z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duration:     z.number().int().min(15).max(600),
  pricePerHour: z.number().min(0).max(10_000).optional(),
  surchargeAmount: z.number().min(0).max(10_000).optional(),
  amountDue:    z.number().min(0).max(100_000).optional(),
});

const bookingSchema = z.object({
  instructorId:      z.string().uuid(),
  pupilName:         z.string().trim().min(1).max(200),
  pupilEmail:        z.string().trim().email().max(255),
  pupilPhone:        z.string().trim().min(1).max(30),
  pupilAddress:      z.string().trim().min(1).max(500),
  pupilPostcode:     z.string().trim().min(1).max(20),
  pickupAddress:     z.string().trim().max(500).optional(),
  pickupPostcode:    z.string().trim().max(20).optional(),
  pickupWhat3words:  z.string().trim().max(100).optional(),
  specialNeeds:      z.string().trim().max(1000).optional(),
  courseType:        z.string().trim().min(1).max(100),
  courseHours:       z.number().min(1).max(200),
  totalPrice:        z.number().min(0).max(100_000),
  platformFee:       z.number().min(0).max(100).optional(),
  slots:             z.array(slotSchema).max(100).default([]),
  paymentType:       z.enum(["full", "deposit"]).optional(),
  amountPaid:        z.number().min(0).max(100_000).optional(),
  depositAmount:     z.number().min(0).max(100_000).optional(),
  upsells:           z.array(z.object({ id: z.string().uuid(), price: z.number().min(0).max(10_000) })).optional(),
  skipNotifications: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Edge function
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const parsed = bookingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const booking = parsed.data;
    const skipNotifications = booking.skipNotifications !== false;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Availability guard ────────────────────────────────────────────────
    // Uses the SAME engine functions as the browser — no bespoke re-implementation.
    if (booking.slots.length > 0) {
      const dates   = [...new Set(booking.slots.map((s) => s.date))].sort();
      const fromYmd = dates[0];
      const toYmd   = dates[dates.length - 1];
      const fromIso = new Date(`${fromYmd}T00:00:00Z`).toISOString();
      const toIso   = new Date(`${toYmd}T23:59:59Z`).toISOString();

      const [whRes, awRes, ovRes, blockRes, evRes, instRes] = await Promise.all([
        supabase.from("instructor_working_hours")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", booking.instructorId).eq("is_active", true),
        supabase.from("availability_windows")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", booking.instructorId).eq("is_active", true),
        supabase.from("instructor_date_overrides")
          .select("override_date, is_available, start_time, end_time")
          .eq("instructor_id", booking.instructorId)
          .gte("override_date", fromYmd).lte("override_date", toYmd),
        supabase.from("instructor_manual_blocks")
          .select("start_datetime, end_datetime")
          .eq("instructor_id", booking.instructorId)
          .gte("end_datetime", fromIso).lte("start_datetime", toIso),
        supabase.from("instructor_calendar_events")
          .select("start_time, end_time, is_busy")
          .eq("instructor_id", booking.instructorId).eq("is_busy", true)
          .gte("end_time", fromIso).lte("start_time", toIso),
        supabase.from("instructors")
          .select("buffer_minutes").eq("id", booking.instructorId).maybeSingle(),
      ]);

      const buffer    = Number(instRes.data?.buffer_minutes ?? 0);
      const wh        = whRes.data ?? [];
      const aw        = awRes.data ?? [];
      const overrides = ovRes.data ?? [];
      const blocks    = blockRes.data ?? [];
      const events    = evRes.data ?? [];

      const conflicts: { date: string; startTime: string; reason: string }[] = [];

      for (const slot of booking.slots) {
        const slotStart = toMinutes(slot.startTime);
        const slotEnd   = toMinutes(slot.endTime);
        const dow       = new Date(`${slot.date}T00:00:00Z`).getUTCDay(); // 0=Sun
        const override  = overrides.find((o: any) => o.override_date === slot.date);

        // ── Resolve working window ────────────────────────────────────────
        let winStart: number | null = null;
        let winEnd:   number | null = null;

        if (override) {
          if (!override.is_available) {
            conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Date marked unavailable" });
            continue;
          }
          if (override.start_time && override.end_time) {
            winStart = toMinutes(override.start_time);
            winEnd   = toMinutes(override.end_time);
          }
        }

        if (winStart == null) {
          // Merge working_hours + availability_windows (same logic as browser engine).
          const winDow   = dow === 0 ? 7 : dow; // availability_windows uses 1=Mon..7=Sun
          const matching = [
            ...wh.filter((w: any) => w.day_of_week === dow),
            ...aw.filter((w: any) => w.day_of_week === winDow || w.day_of_week === dow),
          ];
          if (matching.length === 0) {
            conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "No working hours configured for this day" });
            continue;
          }
          // Find any window that contains the requested slot.
          const fitting = matching.find(
            (w: any) => slotStart >= toMinutes(w.start_time) && slotEnd <= toMinutes(w.end_time),
          );
          if (!fitting) {
            conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Outside instructor working hours" });
            continue;
          }
          winStart = toMinutes(fitting.start_time);
          winEnd   = toMinutes(fitting.end_time);
        } else if (slotStart < winStart || slotEnd > winEnd!) {
          conflicts.push({ date: slot.date, startTime: slot.startTime, reason: "Outside working hours for this date" });
          continue;
        }

        // ── Conflict check via shared engine ─────────────────────────────
        const dayConflicts = buildDayConflicts(
          slot.date,
          blocks.map((b: any) => ({ start_datetime: b.start_datetime, end_datetime: b.end_datetime })),
          events.map((e: any) => ({ start_time: e.start_time, end_time: e.end_time, is_busy: e.is_busy })),
        );

        const result = validateSlot({
          dateStr:         slot.date,
          startMin:        slotStart,
          durationMinutes: slotEnd - slotStart,
          dayStartMin:     winStart!,
          dayEndMin:       winEnd!,
          bufferMinutes:   buffer,
          conflicts:       dayConflicts,
        });

        if (!result.ok) {
          conflicts.push({ date: slot.date, startTime: slot.startTime, reason: describeReason(result.reason, result.cause, buffer) });
        }
      }

      if (conflicts.length > 0) {
        return json({
          error: "SLOT_UNAVAILABLE",
          fallback: true,
          message: "One or more slots are no longer available",
          conflicts,
        }, 200);
      }
    }

    // ── Payment amounts ───────────────────────────────────────────────────
    const paymentType      = booking.paymentType ?? "full";
    const amountPaid       = booking.amountPaid ?? (paymentType === "full" ? booking.totalPrice : (booking.depositAmount ?? 0));
    const remainingBalance = booking.totalPrice - amountPaid;

    let balanceDueDate: string | null = null;
    if (paymentType === "deposit" && booking.slots.length > 0) {
      const first    = [...booking.slots].sort((a, b) => a.date.localeCompare(b.date))[0];
      const due      = new Date(first.date);
      due.setDate(due.getDate() - 30);
      balanceDueDate = due.toISOString().split("T")[0];
    }

    // ── 1. Create pupil ───────────────────────────────────────────────────
    const { data: pupil, error: pupilErr } = await supabase
      .from("pupils")
      .insert({
        instructor_id:    booking.instructorId,
        name:             booking.pupilName,
        email:            booking.pupilEmail,
        phone:            booking.pupilPhone,
        address:          booking.pupilAddress,
        postcode:         booking.pupilPostcode,
        pickup_address:   booking.pickupAddress ?? null,
        pickup_postcode:  booking.pickupPostcode ?? null,
        what3words:       booking.pickupWhat3words ?? null,
        special_needs:    booking.specialNeeds ?? null,
        course_type:      booking.courseType,
        prepaid_hours:    booking.courseHours,
        account_balance:  -remainingBalance,
        progress:         0,
        lessons_completed: 0,
        payment_type:     paymentType,
        deposit_paid:     paymentType === "deposit" ? amountPaid : 0,
        balance_due_date: balanceDueDate,
        deposit_forfeited: false,
      })
      .select()
      .single();

    if (pupilErr) {
      console.error("Pupil insert error:", pupilErr);
      return json({ error: "Failed to create pupil record" }, 500);
    }

    // ── 2. Create lessons ─────────────────────────────────────────────────
    let lessons: any[] = [];
    const awaitingInitialPayment = booking.totalPrice > 0;

    if (booking.slots.length > 0) {
      // Geocode pickup postcode ONCE so every inserted lesson carries lat/lng.
      // Later booking attempts can then compute realistic drive time between
      // the previous lesson's dropoff (or pickup) and this candidate slot
      // without re-hitting postcodes.io. Failure is non-fatal — coords stay null.
      const pickupPostcode = booking.pickupPostcode ?? booking.pupilPostcode;
      let pickupLat: number | null = null;
      let pickupLng: number | null = null;
      if (pickupPostcode) {
        try {
          const r = await fetch(
            `https://api.postcodes.io/postcodes/${encodeURIComponent(pickupPostcode)}`,
          );
          if (r.ok) {
            const j = await r.json();
            pickupLat = j?.result?.latitude ?? null;
            pickupLng = j?.result?.longitude ?? null;
          }
        } catch (err) {
          console.warn("Pickup postcode geocode failed:", err);
        }
      }

      const inserts = booking.slots.map((s) => ({
        instructor_id:            booking.instructorId,
        pupil_id:                 pupil.id,
        lesson_date:              s.date,
        start_time:               s.startTime,
        duration_minutes:         s.duration,
        pickup_location:          booking.pickupAddress  ?? booking.pupilAddress,
        pickup_postcode:          pickupPostcode,
        pickup_lat:               pickupLat,
        pickup_lng:               pickupLng,
        lesson_type:              "driving",
        status:                   "scheduled",
        payment_status:           "pending",
        awaiting_initial_payment: awaitingInitialPayment,
        ...(s.pricePerHour    != null ? { price_per_hour:    s.pricePerHour }    : {}),
        ...(s.surchargeAmount != null ? { surcharge_amount:  s.surchargeAmount } : {}),
        ...(s.amountDue       != null ? { amount_due:        s.amountDue }       : {}),
      }));

      const { data: lessonData, error: lessonErr } = await supabase
        .from("scheduled_lessons").insert(inserts).select();

      if (lessonErr) {
        await supabase.from("pupils").delete().eq("id", pupil.id);
        return json({ error: "Failed to create lesson schedule" }, 500);
      }
      lessons = lessonData ?? [];

      // Free (£0) bookings: push to Google Calendar immediately and roll back on failure.
      if (!awaitingInitialPayment) {
        const failures: string[] = [];
        for (const l of lessons) {
          try {
            await syncLessonNow(supabase, l.id);
          } catch (err) {
            failures.push(err instanceof Error ? err.message : String(err));
          }
        }
        if (failures.length > 0) {
          await supabase.from("scheduled_lessons").delete().in("id", lessons.map((l: any) => l.id));
          await supabase.from("pupils").delete().eq("id", pupil.id);
          return json({ error: "CALENDAR_SYNC_FAILED", message: failures.join("; ") }, 502);
        }
      }
    }

    // ── 3. Next lesson date ───────────────────────────────────────────────
    const sortedLessons = [...lessons].sort(
      (a, b) => new Date(`${a.lesson_date}T${a.start_time}`).getTime()
              - new Date(`${b.lesson_date}T${b.start_time}`).getTime(),
    );
    if (sortedLessons.length > 0) {
      await supabase.from("pupils")
        .update({ next_lesson: sortedLessons[0].lesson_date })
        .eq("id", pupil.id);
    }

    // ── 4. Upsells ────────────────────────────────────────────────────────
    if (booking.upsells?.length) {
      await supabase.from("pupil_upsells").insert(
        booking.upsells.map((u) => ({ pupil_id: pupil.id, upsell_id: u.id, amount_paid: u.price, status: "pending" })),
      );
    }

    // ── 5. Platform fee ───────────────────────────────────────────────────
    if ((booking.platformFee ?? 0) > 0) {
      await supabase.from("platform_fees").insert({
        pupil_id:      pupil.id,
        instructor_id: booking.instructorId,
        amount:        booking.platformFee,
        currency:      "GBP",
        source:        "booking",
        notes:         `${booking.courseType} (${booking.courseHours}h)`,
      }).then(({ error }) => { if (error) console.error("Platform fee (non-fatal):", error); });
    }

    // ── 6. Free-booking payment record ───────────────────────────────────
    if (booking.totalPrice === 0) {
      await supabase.from("payment_history").insert({
        instructor_id: booking.instructorId,
        pupil_id:      pupil.id,
        amount:        0,
        payment_method: "Free",
        notes:         `Free booking: ${booking.courseType}`,
      }).then(({ error }) => { if (error) console.error("Free payment record (non-fatal):", error); });
    }

    // ── 7. Notifications (free / skipNotifications=false) ─────────────────
    if (!skipNotifications) {
      const url   = Deno.env.get("SUPABASE_URL")!;
      const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      fetch(`${url}/functions/v1/confirm-booking`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${svcKey}` },
        body:    JSON.stringify({ pupilId: pupil.id, instructorId: booking.instructorId }),
      }).catch((e) => console.error("confirm-booking (non-fatal):", e));
    }

    return json({ success: true, pupilId: pupil.id, lessonsCreated: lessons.length }, 200);
  } catch (err) {
    console.error("create-booking error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
