# Fix: courses page not displaying

## Root cause

In `src/pages/Courses.tsx` (`fetchData`, ~line 810), `instructor_courses` is fetched globally:

```ts
fetchAll(() => supabase.from("instructor_courses").select("*").eq("is_active", true))
```

With ~5,796 network-placeholder instructors seeded into `public_instructors`, this pulls **27,000+ rows** in 27 paginated round-trips (visible in the network log: offsets 24000/25000/26000…). The page blows past its query budget, the React state never settles in a reasonable time, and no `CourseRowCard`s render.

Same risk applies to `instructor_postcode_rates` (already correctly scoped) — the courses fetch is the outlier.

## Fix

Sequence the loads so courses are scoped to the instructors we actually display:

1. Fetch `public_instructors` (paginated, filtered by `app_slug` when whitelabel) and `course_templates` in parallel — these are bounded.
2. Derive `instructorIds` from the result.
3. Then fetch `instructor_courses` with `.in("instructor_id", instructorIds).eq("is_active", true)`, chunked into batches of 200 IDs to stay under PostgREST URL length limits, each paginated to 1000 rows.
4. Keep the existing `loadCourseAvailabilitySources` call (already scoped to `realInstructorIds`).

This drops the courses fetch from ~27k rows / 27 requests to a few hundred rows in 1–2 requests per district view.

## Technical details

- Add a small helper `fetchCoursesForInstructors(ids: string[])` inside `fetchData` that chunks `ids` (size 200), runs `fetchAll` per chunk with `.in("instructor_id", chunk)`, and concatenates results.
- Replace the current parallel `coursesRes` entry. Restructure the `Promise.all` so step 1 (instructors + templates) resolves first, then step 3 runs.
- Preserve existing error handling: if any chunk errors, surface it the same way `coursesRes.error` is handled today.
- No schema / RLS / UI changes. `CourseRowCard` and downstream filtering stay untouched.

## Files

- `src/pages/Courses.tsx` — restructure `fetchData` only.

## Verification

- Reload `/courses`: network panel should show ≤ a couple of `instructor_courses` requests instead of 27.
- QueryBudget warning ("19 queries in 2000ms") for `/courses` should disappear.
- Course cards render for the default postcode/date.
