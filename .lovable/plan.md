## What's broken

Postcode search on Drive365, Winchester Driving School, and any /courses page returns no instructors. The `public_instructors` view is denying `anon` access, so the courses page loads zero instructors and the postcode lookup has nothing to match against.

## Why it broke (not the white-label work)

The white-label site is a symptom, not the cause. The real change is on the database side:

- The `public_instructors` view exists to safely expose non-PII instructor columns to public visitors.
- It is currently configured with `security_invoker = true`, meaning Postgres runs the underlying `SELECT public.instructors …` **as the calling role** (anon for unauthenticated visitors).
- The base `public.instructors` table no longer has a `SELECT` grant for `anon` (verified — the ACL shows `anon=awdDxtm`, missing the `r` SELECT bit). It only grants INSERT/UPDATE/DELETE etc., which is unusual but that's the current state.
- Result: `select * from public_instructors` as anon → "permission denied for table instructors". Confirmed live by hitting the REST endpoint with the anon key.

This was almost certainly tightened during a recent security-hardening pass (the table has RLS policies that look right — "Active instructors publicly viewable" for anon — but RLS only applies once the role also holds the table grant, and the grant was dropped). Everything that reads `public_instructors` (Courses, WhitelabelCourses, MiniWebsiteCourses, Intensives, SemiIntensive, useCourseDiscovery, etc.) silently returns 0 rows or, on the white-label page, falls back to the "Instructor not found" lookupError shown in the screenshot.

The geocoding edge function itself is healthy (verified — postcodes.io call works and the function returns lat/lng correctly).

## The fix

Switch the `public_instructors` view to **security definer** semantics so it can read the locked-down base table on behalf of public visitors, while the base table stays sealed off to anon (so PII columns like phone/email/lesson_rate that aren't in the view stay private).

Migration:

```sql
ALTER VIEW public.public_instructors SET (security_invoker = false);
-- ensure anon/authenticated can read the safe view
GRANT SELECT ON public.public_instructors TO anon, authenticated;
```

This is the same pattern documented in the project's security guidance: hide sensitive columns behind a view, deny direct base-table access, expose the view publicly.

## Verification after deploy

1. `curl …/rest/v1/public_instructors?select=id&limit=1` with the anon key → returns rows (today: permission denied).
2. Drive365 `/courses` → instructor cards appear without entering a postcode.
3. Drive365 `/courses` → enter `SO30 2TD` (Ken D's postcode) → "Location found!" toast and Ken D's courses listed.
4. winchesterdrivingschool.co.uk → loads Ken D's courses (no "Instructor not found" message).
5. No new PII exposed: hitting `/rest/v1/instructors` with the anon key still returns permission denied.

## Files touched

- New migration only. No app code changes — every caller already queries `public_instructors`.
