## Goal

Add a second booking mode — **"Reserve start date only"** — alongside the existing slot-by-slot flow. The pupil picks a start date and their availability preferences; the system uses the existing availability engine to verify the instructor can finish the course within those constraints; payment goes through normally; the actual lesson times are arranged off-platform.

## Instructor side

**1. New toggle in instructor booking settings** (`instructor_booking_settings`):
- `allow_start_date_only_booking boolean default false`
- `start_date_only_max_hours_per_week int` (optional ceiling the pupil's "hours per week" can't exceed)

Surfaced in the existing Booking Settings page with a short explainer: "Let pupils reserve a start date without picking each lesson time. You'll arrange exact times together after booking."

## Pupil side — booking flow

When the chosen instructor + course has the toggle on, the checkout page shows two tabs:

```text
[ Pick exact lesson times ]   [ Reserve start date only ]
```

The new tab collects:

- **Start date** — single date picker, must be ≥ today + instructor's `min_lead_time`.
- **Target completion window** — "Finish within N weeks of start date" (default suggested from course hours).
- **Days of week** — Mon–Sun multi-select chips.
- **Time-of-day windows** — multi-select chips: Mornings (08–12), Afternoons (12–17), Evenings (17–21).
- **Hours per week cap** — slider, capped by `start_date_only_max_hours_per_week` if set.

Below the form, a live "Availability check" banner runs as the pupil changes inputs:

- ✅ "Yes — your instructor has enough time across [window] to complete your [N]-hour course." → enables payment buttons.
- ⚠ "Not quite — only X of your N hours fit. Try widening days, time windows, or pushing the end date." → payment disabled, suggestion bullets shown.

## Capacity check (strict)

Reuse the existing availability engine — the same one used for the slot-by-slot flow that already factors in working hours, manual blocks, Google Calendar busy events, buffers, and travel time (per existing memory rules). **No new Google Calendar integration work.**

Algorithm (client-side helper, mirrored in an edge function for the final commit):

1. Build the candidate window `[startDate, startDate + completionWeeks]`.
2. Pull the instructor's free slots from the engine across that window.
3. Filter slots to those whose weekday is in the pupil's selected days AND whose start time is inside one of the selected time-of-day buckets.
4. Greedy-pack into "weekly bins"; cap each bin at the pupil's hours-per-week.
5. Sum the packed hours. If `>= course.hours`, pass. Otherwise return shortfall + which constraint is most binding (used to drive the suggestion bullets).

The live banner uses the client helper for instant feedback; the edge function re-runs the same check at payment commit time so capacity can't be raced.

## Persistence

Extend `scheduled_lessons` is the wrong fit — these aren't scheduled yet. Add a sibling table:

`public.course_reservations`
- `id`, `course_id`, `instructor_id`, `pupil_id`
- `start_date date`
- `completion_window_weeks int`
- `allowed_days int[]` (0–6)
- `time_windows text[]` (`morning|afternoon|evening`)
- `hours_per_week_cap int`
- `total_hours int` (course hours snapshot)
- `payment_status`, `payment_intent_id`, `amount_paid_pence`
- `status` enum: `awaiting_scheduling | partially_scheduled | completed | cancelled`
- timestamps + GRANTs + RLS (pupil reads their own; instructor reads via `public.get_instructor_id_for_user(auth.uid())`).

When the instructor later enters real lessons in their scheduler, they link them to the reservation via a nullable `reservation_id` on `scheduled_lessons`, and the reservation status flips automatically once all hours are scheduled.

## Instructor dashboard surface

A new "Reservations awaiting scheduling" card in the instructor dashboard lists open reservations with:
- Pupil name + contact button (already-existing chat/WhatsApp/phone CTAs).
- Start date, end-by date, allowed days, time windows, hours-per-week cap, hours remaining to schedule.
- "Add lesson" button that opens the normal scheduler pre-filtered to the reservation's days/time windows so they don't fall outside the agreement.

## Out of scope (intentionally)

- No auto-fill of lessons from preferences.
- No structured "propose schedule → pupil approves" flow — arrangement is off-platform, per your decision.
- No change to the slot-by-slot booking flow.
- No change to the network-placeholder / coverage path — start-date-only is real instructors only.
- No new Google Calendar code — existing engine already covers busy events.

## Verification

1. Toggle the setting on for a test instructor; confirm both tabs render on that instructor's checkout and only the original tab shows for instructors with it off.
2. Pick a start date with constraints the instructor *can* satisfy → green banner, payment buttons enabled, reservation row created on commit, pupil + instructor both see it in their portals.
3. Tighten constraints until the instructor can't satisfy → banner turns amber, payment disabled, suggestion bullets shown.
4. Edge function re-check: artificially saturate the instructor's calendar between draft and commit; commit must reject with the same shortfall message.
5. Instructor adds a lesson against the reservation; remaining hours decrement; status flips to `completed` when all hours are scheduled.
