## Goal
Eliminate the recurring "postcode search shows no courses" failure by removing the fragile 26 k-row upfront fetch and making sure a selected date is always set after a search.

## Root cause (verified against live DB)
- `instructor_courses` has **26,102** active rows. `useCourseDiscovery.fetchData` paginates them client-side in 1 000-row chunks → **27 sequential Supabase round trips** every page load (plus 6 for instructors). On a mobile or flaky connection a single page can error or be cut off; `fetchAll` then `throw`s and the entire course list is left empty → search returns nothing.
- Only **4 real instructors** exist; the other **5,796** rows are network placeholders. We're paying for 26 k rows just so 20-ish real-instructor courses + a handful of placeholder courses are available.
- Even when courses do load, `handleSearch` calls `findFirstAvailableDate(instructorsNearby, sources)` which uses `hasInstructorAvailabilityOn` — that resolver always returns `false` for placeholders. If the searched district contains **only** placeholders, `selectedDate` is never advanced to a date the placeholder card would show on, so the result list stays empty.

## What to change

### 1. `src/hooks/useCourseDiscovery.ts` — slim the upfront fetch
- Split the `instructor_courses` query in two:
  - **Upfront**: fetch courses **only for non-placeholder instructors** (`WHERE is_active=true AND instructor_id IN (<real ids>)`). With 4 real instructors this is < 50 rows, one round trip.
  - **Lazy on search**: inside `handleSearch`, once we know the searched district, fetch active courses for the placeholders whose `placeholder_district` matches (typically 1-3 instructors → < 30 rows). Merge into `instructorCourses` state via `setInstructorCourses(prev => …)`.
- Same treatment for the `public_instructors` fetch: keep loading the full list (needed for the home browse) but skip the per-row geocoding for placeholders (already done — leave as-is).
- Cache placeholder-course fetches per district in a `Map<district, InstructorCourse[]>` ref to avoid refetching when the user re-runs the same search.

### 2. `findFirstAvailableDate` fallback for placeholder-only areas
- Extract a small helper `firstDateForArea(realInstructorIds, placeholderInArea)` that:
  - tries the existing real-instructor resolver first;
  - if it returns null **and** at least one placeholder is in the area, returns the first day in the next 30 that satisfies `hasNetworkPlaceholderAvailabilityOn` (already imported).
- Use it in both `handleSearch` (line 428) and the initial mount call (line 348).

### 3. Surface load errors instead of silent empty
- In `fetchAll`, when a page errors, also `toast({ title: "Couldn't load courses, please retry", variant: "destructive" })` and break out — so users get feedback if the slim fetch still fails, and we never set partial data without a flag. Same toast on the placeholder-course follow-up fetch.

### 4. Out of scope
- No DB migration, no edge-function changes, no UI/visual redesign.
- Geocoding edge function (`geocode-postcode`) is fine — left untouched.
- The desktop/mobile course-card rendering is untouched.
- Mini-website / WhatsApp / Pupil portal search paths are unaffected (they don't share this hook in the same way; checked file list).

## Testing
- Local: search a postcode in a known placeholder-only district (e.g. AB10) → at least one placeholder card appears and the calendar lands on a working day.
- Search a real-instructor district (e.g. SO30) → real courses appear as today.
- Hard-refresh the homepage → page renders course list in < 1 s instead of the current ~5-8 s pagination loop.
- Throttle network to "Slow 3G" in DevTools → confirm courses still render (previously failed here).
- Run `coursesForSelectedDate` mentally: with reduced `instructorCourses`, real-instructor cards must still match by `instructor_id`; placeholders only get courses after the lazy fetch resolves.