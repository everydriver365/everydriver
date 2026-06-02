# Intensive-only instructor mode

Today instructors can toggle individual 08:00–12:00 / 13:00–17:00 cells via `StandardIntensiveHours`, and tick `offers_intensive` in onboarding — but nothing stops a pupil booking a 1-hour weekly lesson in those windows. This plan adds a proper "Intensive only" mode.

## What changes for the instructor

A new **"Intensive only mode"** card on the Availability page (just above `StandardIntensiveHours`), with:

- A single switch: **Only accept intensive / semi-intensive bookings**
- When turned ON:
  - All Mon–Sun 08:00–12:00 and 13:00–17:00 cells are auto-enabled (one-tap setup)
  - Weekly lesson durations are hidden from pupil booking surfaces
  - Course catalogue is filtered to `intensive` + `semi_intensive` only
  - A small "Intensive only" pill shows on the instructor's mini-website and profile cards
- When turned OFF: behaviour reverts to today's mixed mode (no destructive changes to existing windows).

## What changes for pupils

- Booking flow / mini-website / course cards for that instructor show only intensive + semi-intensive products.
- Weekly duration picker is suppressed for intensive-only instructors.
- "New instructor" / rating badges unchanged.

## Technical

1. **DB migration**
   - Add `instructors.intensive_only boolean NOT NULL DEFAULT false`.
   - Mirror to `public_instructors` view if it's a view (re-create) so pupil surfaces can read it without auth.

2. **Profile hook**
   - Extend `useInstructorProfile` to return `intensive_only`.

3. **New component** `src/components/instructor/IntensiveOnlyToggleCard.tsx`
   - Reads/writes `instructors.intensive_only`.
   - On enable: calls a helper that upserts the 14 standard cells into `availability_windows` and mirrors via `mirrorAwToIwh` (same path `StandardIntensiveHours` uses).
   - Toast confirms; emits `onChanged` so `StandardIntensiveHours` refetches.

4. **Wire into Availability page** (`InstructorAvailabilityWindows.tsx`)
   - Render `IntensiveOnlyToggleCard` above `AvailabilityWindowsManager` and `StandardIntensiveHours`.

5. **Booking-side filtering** (live data only, no fallbacks)
   - In course-listing queries used by `CourseCard` / `DynamicCourseCard` / mini-website course lists / `SchoolBookingPage`, when the instructor has `intensive_only = true`, filter `course.type in ('intensive','semi_intensive')`.
   - In any duration-picker that loads `lesson_durations` for a weekly booking flow, short-circuit with an "Intensive only — choose a course below" empty state when the flag is on.

6. **Mini-website / profile badge**
   - Add a small "Intensive only" pill next to the instructor's name on `InstructorMiniWebsite`, `MiniWebsiteHome`, and `InstructorTile` when the flag is true.

## Out of scope

- No changes to mobile layouts beyond the new card on the existing Availability page (per mobile-update policy — this is settings, not a layout change).
- No changes to payments, syllabus, or scheduler logic.
- No data backfill — existing instructors stay at `false`.

## Verification

- Toggle ON → 14 cells appear in `StandardIntensiveHours`; pupil booking page for that instructor shows only intensive/semi-intensive; "Intensive only" pill visible on mini-website.
- Toggle OFF → flag flips, cells are NOT auto-removed (instructor keeps the schedule they chose), pupil surfaces show full catalogue again.
- Existing instructors unaffected on first load (default false).