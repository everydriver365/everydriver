## Diagnosis

The current `/courses?postcode=SO302TD` preview is not loading any instructors at all:

- Browser request to `public_instructors?is_active=eq.true` returns `[]`.
- Direct backend read confirms SO30 has 2 real active instructors and 2 placeholder instructors with active courses.
- The `public_instructors` view is currently `security_invoker = true`, so anonymous public visitors are affected by the restrictive `instructors` table policies. That makes the public view return empty in the browser even though the data exists.
- A secondary bug remains in the recent lazy placeholder-course fix: `displayHours` is computed before placeholder district courses are loaded, so placeholder-only areas can still show zero cards after the lazy fetch.

## Plan

1. **Restore public instructor visibility safely**
   - Add a database migration to recreate `public.public_instructors` as a public discovery view that returns active, non-deleted instructor rows needed by learner-facing search.
   - Keep the existing public field list, do not expose new private fields.
   - Ensure public read access remains granted to anonymous and signed-in visitors.

2. **Keep the browser course query lightweight**
   - Leave the new “real instructors upfront, placeholder courses on search” strategy in place so the app does not go back to the fragile 26k-row load.

3. **Fix placeholder-only result rendering**
   - Update `useCourseDiscovery.ts` so placeholder lazy-loaded courses contribute their course-hour values immediately for searched districts, instead of relying on the precomputed `displayHours` list from initial load.
   - Keep real instructor course matching unchanged.

4. **Verify SO30 search**
   - Re-test `/courses?postcode=SO302TD` in the preview.
   - Confirm `public_instructors` returns real rows in the browser, the auto-search runs, and the result count is no longer zero.