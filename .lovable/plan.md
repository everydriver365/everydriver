## What the data says for Ken D on Thu 18 Jun 2026

- **Working hours (Thu):** 10:30 – 16:00 (5h30m).
- **Hard gates:** `available_from = 2026-06-01` ✓ (18 Jun is after), no date override, no manual block, no holiday rule.
- **Google Calendar busy events on 18 Jun:**
  - 06:00–09:00 "National Speed Awareness with Ken" (before window — ignored)
  - 06:00–09:00 "18/06/2026 – 7am – NSAC"           (before window — ignored)
  - 17:00–20:00 "18/06/2026 – 6pm – NSAC"           (after window — ignored)
  - Two "Lotty : College AM" all-day rows are `is_busy=false` → engine correctly skips them.
- **Scheduled_lessons on 18 Jun:** 8 bookings (10:30 ×4, 11:00 ×3, 13:30 ×1, 120 min each). Per the unified rule (`mem://constraints/google-calendar-source-of-truth`), `scheduled_lessons` is CRM-only and **never** consulted for availability.

## So what is the engine actually returning?

Inside Ken's 10:30–16:00 window the engine sees **zero conflicts**. It should return ~5h of bookable slots on 18 Jun. The "nothing for Ken D" symptom on `/courses` therefore is NOT the slot engine refusing the day — it is one of two real problems:

### Root cause A (most likely): GCal sync from `scheduled_lessons` is broken for Ken

Rule 5 of the unified engine says every booking writes a Google Calendar event so the calendar is the single source of busyness. Ken has 8 real lessons booked on 18 Jun but **none of them appear in `instructor_calendar_events`** — only the unrelated NSAC/WDU courses do. Because of that, the engine genuinely thinks 10:30–16:00 is free and offers it, while the rest of the UI (course cards, scheduler) may suppress Ken for other reasons, producing the "nothing" you're seeing.

If `coursesForSelectedDate` / `LessonScheduler` correctly *does* surface slots, the inverse problem is true: the page is offering double-bookings into already-full days.

### Root cause B (worth checking, less likely)

The `/courses` page hides Ken on 18 Jun via a non-availability filter:
- postcode / radius scope (`instructorsInArea` excludes Ken for the searched postcode), or
- Ken's `instructor_courses` row doesn't cover the selected course length / type.

## Plan

1. **Confirm which symptom you have**
   - Open `/courses`, pick 18 Jun: do you see Ken with zero slot tiles, or no Ken card at all? "No card at all" = root cause B (filter). "Card but empty" = root cause A (slots offered when they shouldn't be) or a card-render bug.

2. **Fix the real bug — make the engine see Ken's existing bookings**
   - Add a one-shot reconciliation: for every `scheduled_lessons` row whose `lesson_date >= today` and that has no matching `instructor_calendar_events` row (by `external_event_id` / lesson id), push it into Google Calendar via `google-calendar-service`. Log mismatches per instructor.
   - Add a guard in `create-booking` that fails the booking if the post-write GCal mirror returns an error, so we never silently drop a booking off the calendar again.
   - Add an instructor-side warning banner (next to `AvailabilityDiagnostic`) when `count(scheduled_lessons in next 30 days) > count(matching calendar events)`.

3. **(Optional but recommended) Belt-and-braces availability source**
   - Keep the "GCal is the source of truth" rule, but in `loadCourseAvailabilitySources` also fetch future `scheduled_lessons` for the same instructors and merge them into `calendarEvents` as `is_busy=true` synthetic rows tagged `source:"scheduled_lesson"`. This way a sync gap can never cause a double-book; the rule stays "calendar wins" but a missing mirror is no longer dangerous.

4. **If the symptom is actually B (filter hiding Ken)**
   - Verify Ken's `home_postcode` (`SO30 2TD`) geocodes inside the searched radius.
   - Verify there is an `instructor_courses` row for Ken matching the selected hours/type — if not, the card is correctly hidden and the fix is to add the missing product, not to change the engine.

### Technical notes

- Files involved: `src/lib/courseAvailability.ts`, `supabase/functions/google-calendar-service/index.ts` (new `reconcileLessons` action), `supabase/functions/create-booking/index.ts` (post-write check), `src/components/instructor/AvailabilityDiagnostic.tsx` (new warning), `src/hooks/useCourseDiscovery.ts` (optional merge).
- No schema change required for step 2; step 3 needs no schema change either (lessons already store `start_time`/`duration_minutes`).
- Memory update: amend `mem://constraints/google-calendar-source-of-truth` to add "with a `scheduled_lessons` safety net" if step 3 is adopted.

Tell me which symptom you actually see on `/courses` for 18 Jun (no Ken card vs Ken card with no slots) and I'll implement the matching fix.
