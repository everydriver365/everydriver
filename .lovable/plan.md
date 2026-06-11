## Plan

1. **Fix the broken enquiries count query**
   - Update the instructor notification/enquiries hook so:
     - `booking_enquiries` filters by `instructor_id`
     - `course_enquiries` filters by `assigned_instructor_id`
   - This matches the live database schema and stops the repeated backend error that is still being logged.

2. **Stop page switches getting stuck behind lazy-loading spinners**
   - Replace the `fallback={null}` wrappers on the instructor router pages with a small, real loading state.
   - Tighten `lazyWithRetry` so a failed page chunk does not leave React waiting forever after retries/reload.
   - Apply this to Schedule, Pupils, Payments, Inbox, Reports, and Availability routers.

3. **Make key page data loads fail-safe**
   - Add/confirm `try/catch/finally` guards on the main Schedule and Pupils data fetches so any failed database read releases loading and shows an empty/error state instead of an endless spinner.
   - Keep this scoped to instructor desktop/mobile page loading only.

4. **Fix the remaining health-check backend error**
   - Update `tile-health-check` so message counts go through `conversations` rather than filtering `messages.instructor_id`, because `messages` has no `instructor_id` column.
   - Redeploy that function after code changes.

5. **Validate after implementation**
   - Re-check recent backend errors for:
     - `booking_enquiries.assigned_instructor_id`
     - `course_enquiries.instructor_id`
     - `messages.instructor_id`
   - Open `/instructor/schedule` and `/instructor/pupils` in preview and confirm they no longer stay on a spinner.

## Technical notes

The current evidence points to two separate issues: stale/wrong database column references causing backend errors, and route-level lazy loading that can leave a page transition stuck with only a spinner or blank fallback. The fix addresses both rather than masking the spinner only.