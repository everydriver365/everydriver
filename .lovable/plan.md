## Goal

Guarantee that **every** booking entry point — pupil-facing, instructor-facing, and AI/automated — checks Google Calendar before offering or confirming a slot. Today some flows only read the cached `instructor_calendar_events` table; others skip Google entirely and rely on `scheduled_lessons` + working hours. The cache itself can be stale (cron sync runs on a schedule).

## Current state

Already consults `instructor_calendar_events` (cached Google sync):
- `LessonScheduler.tsx` (public course booking) — date tiles AND slot list both block on Google events. ✅ already correct.
- `useInstructorAvailabilitySearch.ts`, `useRealGapSlots.ts`, `lib/courseAvailability.ts`, `pages/PublicAvailability.tsx`, `AddLessonSheet.tsx`, `RescheduleLessonSheet.tsx`, `MultiDayScheduleView.tsx`, `MobileMonthCalendarView.tsx`, `NewMobileScheduleView.tsx`, `ScheduleDayTabs.tsx`, `end-lesson/StepBookNext.tsx`, `GapsFiller.tsx`, `autoScheduler.ts`.

Likely gaps to verify and fix:
- `lib/lessonClashCheck.ts` — final write-time clash check before inserting a lesson. Must include Google events.
- AI booking approval path (Famulor) — confirm it runs the same clash check.
- Pupil portal "request reschedule" / "find me a slot" flows.
- Any flow reading only `scheduled_lessons` without joining `instructor_calendar_events`.

The cache can lag because the bi-directional sync (memory: `automated-google-calendar-sync`) runs on `pg_cron`, not on demand.

## Plan

### 1. Audit (read-only, produce a checklist)
- Grep every booking-write path: insert into `scheduled_lessons`, AI booking confirmation, reschedule, gap-fill, manual add, course checkout finalisation.
- For each, confirm it runs `lessonClashCheck` (or equivalent) and that the check queries `instructor_calendar_events` AND `scheduled_lessons` AND `instructor_date_overrides`.
- Output the gap list as a doc at `docs/qa/google-calendar-coverage.md`.

### 2. Centralise the "is this slot free?" check
- Make `lib/lessonClashCheck.ts` the single source of truth. It must take `(instructorId, dateStr, startTime, durationMinutes, bufferMinutes)` and reject if **any** of: existing scheduled lesson, manual block, `instructor_calendar_events` row, or full-day override overlaps (with buffer).
- Replace ad-hoc clash checks in write paths with this function.

### 3. Freshen Google data on demand at every booking entry
- Add a lightweight "refresh-on-open" call to `google-calendar-service` action `resyncRange` (or `fetchExternalEvents` with persist=true) when a booking surface mounts:
  - Public `LessonScheduler` (course booking) — sync the instructor for `[today, today + booking_advance_days]` once per session, debounced.
  - Instructor `AddLessonSheet` / `RescheduleLessonSheet` — sync for the visible week.
  - `FindAppointmentBody` / `useInstructorAvailabilitySearch` — sync for the search horizon.
  - AI booking approval (Famulor) — sync the targeted day **server-side** before computing free slots.
- Failure to sync must NOT block the UI: fall back to cached events and show a small "calendar last synced HH:mm" hint.

### 4. Server-side guard at write time
- In the edge function (or RPC) that inserts a `scheduled_lessons` row, call `google-calendar-service.fetchExternalEvents` for the target date right before inserting, then run `lessonClashCheck`. This is the last line of defence against a stale cache.
- If a Google conflict is found, return a structured error so the UI can show "This slot was just taken in your Google Calendar — pick another time."

### 5. Tests / verification
- Add a Vitest suite for `lessonClashCheck` covering: lesson overlap, buffered overlap, Google event overlap, all-day-event ignore, override-block, no-conflict.
- Manual QA pass (documented in the same `docs/qa/google-calendar-coverage.md`) for each of the 8+ booking entries listed above.

## Technical details

- Use existing `google-calendar-service` action `resyncRange` for date-range refresh (already writes to `instructor_calendar_events`).
- Debounce client-side refresh per `(instructorId, range)` with a 60-second TTL in `sessionStorage` to avoid hammering the edge function on tab focus.
- All-day events (>= 24h) continue to be informational only, matching the existing `LessonScheduler` rule.
- Buffer logic stays per memory `lesson-buffer-logic` and `gap-offer-buffer-rules` (first-of-day vs back-to-back).
- Live-data rule: if Google sync fails AND the cache is empty for that instructor, surface a clear "Calendar unavailable, please retry" empty state — never silently allow bookings.

## Out of scope

- Changing the bi-directional sync architecture (still service account + DWD per memory).
- Editing mobile layouts beyond what is needed for the empty/error states (per mobile update policy).
