

## Improving Test Slot Scraping, Matching, and Alerting

### Current Problems

1. **No direct instructor notification** -- When a scraped slot matches a "want_test" request, the system only logs to `admin_activity_log` and sends an SMS to the admin. The instructor is never directly notified (no `instructor_notifications` record is created).
2. **No push notification** -- Instructors with push enabled never receive a push alert about matching slots.
3. **Duplicate scraped_match records** -- Case-sensitivity in centre name matching causes duplicates (e.g. "Lee on the Solent" vs "Lee On The Solent").
4. **Notification count relies on polling** -- `useTestSwapNotifications` counts `test_slot_reservations` rows, but the instructor has no clear way to see *which* slots matched or dismiss them.
5. **No "matched slots" view** -- Instructors see a generic notification badge but no dedicated UI showing "These scraped slots match your requests."
6. **Admin has no consolidated view** -- Admin SMS is the only alert; there is no admin dashboard panel for reviewing/actioning scraped matches.

### Proposed Improvements

**1. Insert instructor notifications on match (edge function change)**

When `checkForMatchingRequests` finds matches, also insert into `instructor_notifications` for each affected instructor with:
- `type: 'test_slot_match'`
- `title: 'Test Slot Available!'`
- `message: '{centre} - {date} at {time}'`
- `action_url: '/instructor/test-requests'` (takes them to the Available tab)
- `metadata: { centre, date, time, request_id }`

This immediately surfaces in the existing notification bell and notification panel.

**2. Send push notifications to matched instructors**

After inserting the notification, invoke the existing `send-push-notification` edge function for each matched instructor so they get an instant push alert on their device.

**3. Fix case-insensitive deduplication**

Change the dedup check in the edge function to use case-insensitive comparison (`.ilike()` or normalise centre names to lowercase before comparison) to prevent duplicate `scraped_match` records.

**4. Add a "Matched Slots" section in the Test Swap page**

On the instructor's Test Requests page (Available tab or a new sub-section), show scraped_match records specifically for that instructor with action buttons:
- "Reserve" (changes status to `pending` and alerts admin)
- "Dismiss" (deletes the record)

This replaces the current vague notification badge with an actionable list.

**5. Admin scraped-match review panel**

Add a section to the existing admin test-swap management area that lists all `scraped_match` records grouped by instructor, with the ability to confirm or dismiss them.

### Technical Details

**Edge Function: `supabase/functions/scrape-test-slots/index.ts`**

- In `checkForMatchingRequests`, after the dedup insert loop, batch-insert into `instructor_notifications`
- Normalise centre names with `.toLowerCase().trim()` before comparison
- After notification insert, call `send-push-notification` for each unique instructor ID

**New Component: `src/components/test-requests/MatchedSlotsList.tsx`**

- Queries `test_slot_reservations` where `status = 'scraped_match'` and `instructor_id = current`
- Shows each match as a card with centre, date, time
- "Reserve" button updates status to `pending`
- "Dismiss" button deletes the row
- Subscribes to realtime changes on `test_slot_reservations`

**Modified Component: `src/pages/InstructorTestRequests.tsx`**

- Add `MatchedSlotsList` above or within the "Available" tab content, highlighted with a distinct banner when matches exist

**Modified Hook: `src/hooks/useTestSwapNotifications.ts`**

- Simplify scraped match counting to just count `scraped_match` status rows for this instructor (no need to cross-reference centre names since edge function already does matching)

**Admin Component Enhancement**

- In the admin test-swap section, add a "Scraped Matches" tab listing all `scraped_match` reservations with instructor name, slot details, and action buttons

**No database migration required** -- all needed tables and columns already exist.

