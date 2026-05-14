# Fix: courses/instructors not showing on public search

## Root cause

The browser console shows:

```
error: permission denied for table instructors
[Courses] No instructors within 10mi of SO302TD – expanding to 25mi
```

`src/hooks/useInstructorAvailabilitySearch.ts` (line 113) queries the protected `instructors` table:

```ts
supabase.from("instructors").select("id, name, car_type, home_postcode, buffer_minutes")
```

Public visitors aren't authenticated, so RLS denies the read, the result is empty, and downstream every date returns zero availability — so the calendar has no available dates and the grid shows no courses.

Every other public surface (`useCourseDiscovery`, mini-site, etc.) reads from the `public_instructors` view, which is the security-invoker view exposing only non-PII fields and is allowed for anon.

## Change

Single-line fix in `src/hooks/useInstructorAvailabilitySearch.ts`:

- Replace `.from("instructors")` with `.from("public_instructors")` for the availability batch query.
- Keep the same selected columns (`id, name, car_type, home_postcode, buffer_minutes` — all present on the view, verified against the live schema).

No other files need changes. Availability logic, working-hours/overrides/lessons/blocks/calendar reads are unaffected (they already query the right tables under their own RLS).

## Verification

1. Reload `/courses` (or `/drive365/search`) as anonymous visitor with postcode `SO22 5DR` / `SO30 2TD`.
2. Console should no longer show `permission denied for table instructors`.
3. Calendar should show available dates with instructor avatars; grid should list real courses.
4. Confirm no regression on the instructor portal (which still has full RLS access via the base table elsewhere).

## Out of scope

No schema/RLS changes — `public_instructors` already exists for exactly this purpose. No new fallbacks; if an instructor has no working hours configured they still correctly produce zero availability per the LIVE DATA ONLY rule.
