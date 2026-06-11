## Problem

`/courses` is stuck on "Finding instructors near you…" because `useCourseDiscovery.fetchData` (`src/hooks/useCourseDiscovery.ts`) does:

```ts
supabase.from("public_instructors").select("*").eq("is_active", true)
```

paginated in 1000-row chunks. The table has **5,800 active rows** (5,796 network-placeholder seeds + 4 real instructors) and 240 columns. That single load dominates time-to-first-render, so `setLoading(false)` never fires fast enough and the grid never shows real courses.

The legacy `src/pages/Courses.tsx` already solved this with a two-phase load — that pattern was lost when the hook was introduced.

## Fix

Refactor `useCourseDiscovery.fetchData` to mirror the proven two-phase load:

**Phase 1 (blocking, fast):** load only real instructors.
- `public_instructors` `select *` `eq is_active true` `eq is_network_placeholder false` — ~4 rows.
- Continue with `course_templates`, `instructor_premium_placements`, `instructor_courses` (scoped to real ids), `loadCourseAvailabilitySources`, and the postcode geocoding pass exactly as today, but only over real ids.
- `setInstructors(realOnly)`, `setLoading(false)` — page now renders.

**Phase 2 (background, non-blocking):** load placeholders with a slim column set.
- After Phase 1 awaits resolve and `loading` is false, fire a second `fetchAll` against `public_instructors` with `.eq("is_network_placeholder", true)` and the explicit slim select used in the old `Courses.tsx`:
  `id,name,home_postcode,placeholder_district,is_network_placeholder,is_active,lat,lng,profile_image_url,brand_colour,app_slug,hourly_rate,car_type`.
- Merge into the existing `instructors` state (dedupe by id) so postcode search can still resolve coverage placeholders for districts with no real instructor.
- Wrap in `try/catch`; failures here must not toast or block the rendered page.

No schema, RLS, edge function, or UI component changes. The existing `instructorsInArea` placeholder-matching logic already handles a deferred placeholder population.

Keep `instructorId` early-exit and the eslint-disabled deps comment intact.

## Verification

1. Hard-refresh `/courses?postcode=SO302TD` in the preview.
2. Confirm courses for the 4 real instructors render within ~1–2s instead of hanging on the spinner.
3. Confirm searching a placeholder-only district (after a few seconds) still surfaces the coverage card (placeholder background load completed).
4. Network panel: first batch is one small `public_instructors` query, not six 1000-row pages.

## Out of scope

- Visual changes to `CourseResults`, `SidebarCalendar`, `CourseGrid`.
- Any change to `public_instructors` shape, RLS, or the network-placeholder filter rule.
- Touching `WhitelabelCourses` or the embed variant — they share the hook and inherit the fix.
