Plan

1. Courses page crash / date gate
- Confirm `CourseGrid.tsx` has no JSX wrapped in `useMemo` and no `!selectedDate` gate.
- Confirm `useCourseDiscovery.ts` no longer returns empty results just because `selectedDate` is null.
- If any remaining selected-date empty-state logic exists, remove only that gate so postcode searches show courses immediately and date selection only filters.

2. Richard Chapman Google reviews
- Update `fetch-google-reviews` so `instructorId` alone is enough:
  - Load the instructor by ID.
  - If `google_place_id` exists, refresh by place ID.
  - If missing, build a Places lookup query from instructor `name` + `home_postcode` and resolve `place_id` automatically.
  - Save `google_place_id`, `google_rating`, `google_review_count`, top review text/author, and fetched timestamp back to the instructor.
- Deploy the updated function.
- Invoke it for Richard Chapman: `1b49d152-1088-4587-8f80-b325ba41c1af`.
- Verify his instructor row now has Google review values populated, or report the exact Google Places error if no matching business is found.

3. Publish
- Check the publish preflight metadata remains relevant: title, description, OG/Twitter tags, favicon.
- Security scan already shows warnings only, no critical blocker.
- Publish the current project so the course-page fix reaches production.

Outcome
- `/courses` production should receive the current no-date-gate bundle.
- Richard Chapman’s reviews should populate if Google Places can resolve his listing by name/postcode.
- I’ll report exactly what changed and whether publishing was scheduled successfully.