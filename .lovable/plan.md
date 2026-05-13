## Why Richard isn't showing for SO22

Richard's home postcode is SO30 2TD with lat/lng set, radius 20 miles, `is_active=true`, `availability_paused=false`. SO22 5DD is well within 20 miles, so distance is not the problem.

The real cause is a **table mismatch**:

- The Courses search page (`src/pages/Courses.tsx` line 774) reads weekly working hours from `instructor_working_hours`.
- Richard's weekly hours (Mon–Fri 08:00–20:00, Sat/Sun 08:00–12:00) are stored in `availability_windows`, not `instructor_working_hours`. The latter table only has rows for 3 instructors total; everyone else (including Richard) lives in `availability_windows`.

Result: the day-availability check at lines 370–375, 487–492, 525–530 finds zero matching rows for Richard, so no date in any month is "available" for him and he's filtered out of every search result.

## Fix

In `src/pages/Courses.tsx`:

1. In `fetchData` (~line 770), also fetch `availability_windows` (`instructor_id, day_of_week, start_time, end_time, is_active`) in parallel with the existing queries.
2. Merge both sources into the existing `workingHours` state: take rows from `instructor_working_hours`, and for any instructor with no rows there, fall back to their `availability_windows` rows. (Simpler: union both lists — the `is_active && day_of_week` check is the only thing that matters for the date filter, and duplicates are harmless because we use `.some()`.)
3. No schema/RLS/migration changes. No UI changes. Drive365 vs DSM branding unaffected.

## Technical notes

- `availability_windows` already uses `day_of_week` 1=Mon..7=Sun and an `is_active` boolean, matching the shape the existing code expects.
- `WorkingHours` type only needs `instructor_id`, `day_of_week`, `is_active`, so a plain union works without type changes.
- This will also fix every other instructor whose hours are only in `availability_windows`.
