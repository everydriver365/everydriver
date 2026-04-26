## Goal

Give instructors a button to manually re-sync Google Calendar for a chosen **date range**, then show a clear summary of which lessons were **added**, **removed**, or **left unchanged** as a result of the sync.

## Where it lives

In the existing `GoogleServiceAccountSetup` panel (the same place the current "Sync now" button lives), add a new section: **"Re-sync a date range"**.

UI elements:
- Two shadcn date pickers: **From** and **To** (defaults: today − 7 days → today + 30 days).
- Quick presets: **Last 7 days**, **Next 30 days**, **This month**.
- Primary button: **"Re-sync this range"**.
- Result panel that appears below the button after sync completes:
  - Header: counts — `Added: 3 · Removed: 1 · Unchanged: 12`.
  - Two collapsible lists: **Added** (green) and **Removed** (red), each row showing date · time · pupil/title · pickup location.
  - "Done" button to dismiss.

## Backend changes

Extend the existing `google-calendar-service` edge function with a new action: `resyncRange`.

Request body: `{ action: "resyncRange", instructorId, fromDate, toDate }` (ISO date strings).

What it does (server-side, atomic):
1. Validate input. Reject ranges over 366 days.
2. Snapshot the current `instructor_calendar_events` rows for that instructor whose `start_time` overlaps `[fromDate, toDate]` — capture `external_event_id`, `title`, `start_time`, `end_time`, `location`.
3. Fetch fresh Google Calendar events for that exact `timeMin`/`timeMax` window using the same paginated fetch and meeting/colour extraction code already in `fetchExternalEvents` (refactor that block into a shared helper inside the file).
4. Diff by `external_event_id`:
   - **Added** = in fresh, not in snapshot.
   - **Removed** = in snapshot, not in fresh.
   - **Unchanged / updated** = in both (treated as unchanged for the summary; updates still apply to the row via upsert).
5. In a single transaction-like sequence: delete the rows in **Removed**, upsert the fresh rows (so both new and changed events land), and update `last_sync`.
6. Respond with:
   ```json
   {
     "success": true,
     "range": { "from": "...", "to": "..." },
     "counts": { "added": 3, "removed": 1, "unchanged": 12 },
     "added":   [{ "id", "title", "start", "end", "location" }, ...],
     "removed": [{ "id", "title", "start", "end", "location" }, ...]
   }
   ```

Important: only events in the requested window are touched, so this never wipes events outside it.

## Frontend changes

- New hook method on `useGoogleServiceCalendar`: `resyncRange(from: Date, to: Date)` returning the diff payload above.
- New component `CalendarResyncRangePanel` rendered inside `GoogleServiceAccountSetup` below the existing "Sync now" controls.
- Toast on success: `"Re-sync complete · +3 added · −1 removed"`.
- Invalidate the React Query keys the lessons/calendar use (`today-remaining-lessons`, `day-lessons`, `tomorrow-lessons`, `instructor-calendar-events`) so the rest of the app reflects the diff immediately.

## Out of scope

- Modifying scheduled lessons created from Google events through other paths (the diff operates on `instructor_calendar_events` rows, matching the rest of the sync).
- Changing the existing 30-days-back / 365-days-forward background sync.
- Multi-calendar selection (still uses the connected calendar on `instructor_google_service_calendar`).
