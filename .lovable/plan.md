## Goal

Make the pupil portal **Book** screen (hamburger → Book) show the same slots the instructor would see in their own diary, by reusing the unified availability engine (`computeDaySlots` + `loadCourseAvailabilitySources`) that already powers the public booking page, /courses, the auto-scheduler, the instructor gap-fill, and the create-booking guard.

This removes a hand-rolled, partial implementation in `src/components/pupil-portal/PupilPortalGaps.tsx` and replaces it with the canonical engine.

## What's wrong today

`PupilPortalGaps` rolls its own slot maths:

- Treats `scheduled_lessons` as a busy source — **violates** the project rule that Google Calendar + `instructor_manual_blocks` are the only sources of busy.
- Does **not** read `instructor_manual_blocks` at all (manual blocks won't hide slots).
- No buffer between lessons and no first-lesson-of-day instructor travel buffer.
- No travel-time padding around existing lessons even when pickup coords are known.
- Uses browser-local `getHours()` / `getDay()` instead of Europe/London clipping.
- Skips all-day Google Calendar events ≥ 24h, so holiday blocks don't block the day.
- Hardcodes a 60-minute duration for both the gap minimum and the booking insert — ignores pupil's preferred lesson length, instructor `slot_increment_minutes`, and smart "no orphan gap" filtering.
- No `available_from`, min-notice, or `is_network_placeholder` gating.

## Plan

### 1. Rewrite `PupilPortalGaps` to use the engine

In `src/components/pupil-portal/PupilPortalGaps.tsx`:

- Fetch the instructor row (`id, available_from, buffer_minutes, slot_increment_minutes, first_lesson_buffer_minutes, is_network_placeholder, default_lesson_duration_minutes`).
- Fetch the pupil row (pickup postcode → lat/lng via existing `postcodes.io` helper, and preferred lesson duration if stored on the pupil).
- Call `loadCourseAvailabilitySources({ instructorIds: [instructorId], from, to })` to get the canonical bundle of working hours, manual blocks, calendar events and booked-lesson geo.
- For each of the next 14 days call `computeDaySlots(instructor, day, src, { durationMinutes, bufferMinutes, firstLessonBufferMinutes, slotIncrementMinutes: instructor.slot_increment_minutes, minNoticeMinutes, candidatePickup })`.
- Render the returned `slots[]` grouped by day. Show an empty state when no slots ("No availability in the next 14 days — try again later").
- Keep the existing `checkLessonClash` pre-insert guard before writing the booking; this is still required as a race-condition belt-and-braces.

### 2. Duration selection

- Default to the instructor's `default_lesson_duration_minutes` (already used by the public booking page).
- Add a simple duration chip row (60 / 90 / 120 min, only those ≤ instructor max). No new business logic — same options the public booking page exposes.
- Pass the chosen duration into `computeDaySlots` and into the booking insert so the pupil books the exact slot they see.

### 3. Booking write

Keep the booking insert in `scheduled_lessons` (no change to schema). After insert, rely on the existing `sync-lesson-now` trigger to push the new lesson into Google Calendar — that's already the single source of truth for downstream availability, so the next render of the screen will hide the slot.

### 4. UI

Visual changes are minimal — keep the existing card list, brand colour, and bottom-sheet confirm. Only the data underneath changes. No mobile layout edits beyond what's needed to show duration chips.

### 5. Cleanup

- Delete the dead local `WorkingHours` / `ScheduledLesson` interfaces and the bespoke `calculateAvailableSlots` function.
- Add a top-of-file comment pointing at `courseAvailability.ts` so the next developer doesn't re-roll their own version.

## Out of scope

- No changes to the engine itself.
- No changes to the bottom nav, hamburger menu, or any other pupil portal section.
- No changes to payment, notifications, or the lesson-sync pipeline.
- No schema migrations.

## Files touched

- `src/components/pupil-portal/PupilPortalGaps.tsx` — rewritten to use `computeDaySlots` + `loadCourseAvailabilitySources`.

## Verification

- Open `/p/ken-d` → hamburger → Book. Confirm slots match what shows in the instructor's own diary for Ken.
- Add a manual block in the instructor portal → reload pupil Book → that window disappears.
- Add a Google Calendar event → reload → that window disappears.
- Book a slot as the pupil → it disappears from subsequent loads (because the lesson-sync trigger writes it into `instructor_calendar_events`).
