## Why courses are not showing

The page is not currently crashing in the preview; it is stuck in the “Finding instructors near you...” state.

The immediate cause is the `/courses` page’s local search flow:

- It uses its own legacy course-loading logic instead of the newer `useCourseDiscovery` hook.
- URL postcode auto-search calls `handleSearch()` after loading, but the search/date state can still end up with `selectedDate = null`.
- The render branch treats `selectedDate === null` as “still loading”, even after `loading` is false, so users never see either course cards or a proper “no courses found” state.
- For `SO302TD`, live data exists: one real active SO30 instructor with active courses plus two network placeholder instructors, so the page should not be indefinitely loading.

## Plan

1. **Fix the stuck-loading condition**
   - In `src/pages/Courses.tsx`, change the results panel so `selectedDate === null` only shows a loading message while `loading` or `isSearching` is true.
   - Once loading/searching is finished, show the existing “No courses found” state instead of the fake loading state.

2. **Make URL postcode search deterministic**
   - Update the URL auto-search effect to call `handleSearch(initialPostcode)` instead of relying on the `postcode` state closure.
   - This avoids timing issues where the URL contains a postcode but the search runs against stale/empty state.

3. **Remove temporary diagnostic noise**
   - Remove the `[Courses search]` console logging and warning-only diagnostics from the public course search path.

4. **Improve slow loading without changing business rules**
   - Keep the live-data policy intact.
   - Avoid extra work caused by the legacy page where possible, but do not introduce hard-coded fallback courses or fake availability.
   - Keep placeholder courses lazy-loaded by searched district, as currently intended.

5. **Validate**
   - Open `/courses?postcode=SO302TD` in preview.
   - Confirm the page leaves “Finding instructors near you...” and shows either real course rows/cards or a truthful empty state.
   - Check console/network for errors after the change.