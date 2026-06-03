## Diagnosis

`bookings.drive365.co.uk` serves the **published** bundle. The data is correct:

- `booking_pages` row for `chapmans` exists, `page_type = 'group'`, `is_active = true`
- `booking_page_instructors` has two rows: Richard Chapman (display_order 0) and Ken D (display_order 1)
- Both are in `public_instructors` with `is_active = true`
- Anonymous API access works for all three tables (verified with curl)

In the preview, `PublicBookingPortal` correctly handles `page_type = 'group'` by reading `booking_page_instructors`. The empty state on the live custom domain means the deployed JS bundle is older than this branch of the code, so it falls through to the empty array.

## Fix

No code change needed.

1. Open the **Publish** dialog (top right).
2. Click **Update** to push the latest bundle.
3. Hard-refresh `bookings.drive365.co.uk/booking/chapmans` (Cmd/Ctrl-Shift-R).

Both instructor cards (Richard + Ken) should then render under "Our Instructors", and the embedded course explorer at the top will continue to work as it already does on preview.

## If it still shows empty after re-publishing

Then there is a runtime issue in production specifically. Next step would be to add a one-line `console.error` around the `booking_page_instructors` fetch so we can see the exact error in the production console, but we should only do that after ruling out the stale-bundle case above.

## Technical details

- File: `src/pages/PublicBookingPortal.tsx` — `group` branch at lines 81–98 already queries `booking_page_instructors` then `public_instructors` and orders by `display_order`.
- No DB migration required; data is already in place.
- No RLS or GRANT changes required; anon read access on the three tables is already permitted.
