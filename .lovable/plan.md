

# Fix: Google Calendar Sync Not Saving Future Events

## Problem

The scheduled calendar sync imports 125 events from Google but only 1 future event ends up in the database. The root cause is a **unique constraint violation** on the `instructor_calendar_events` table.

## Root Cause (Step by Step)

1. The `scheduled-calendar-sync` function first **deletes** events where `start_time >= now` (only future events).
2. Then it tries to **bulk insert** all fetched Google events (which may include events whose `external_event_id` already exists as a past record).
3. The table has a **unique constraint** on `(instructor_id, external_event_id)`.
4. If any Google event shares an `external_event_id` with an existing past record, the entire batch insert fails with a duplicate key error.
5. Result: zero future events get saved.

## Fix

### 1. Update `scheduled-calendar-sync` to use upsert instead of insert

Replace the `.insert(eventsToInsert)` call with `.upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' })`. This will:
- Insert new events normally
- Update existing events (e.g., if a past event's time changed) instead of failing

### 2. Apply the same fix to `calendar-sync` (manual sync)

The `importBusyTimes` and `fullSync` actions in `calendar-sync/index.ts` also use `.insert()`. These should also be changed to `.upsert()` for consistency.

Additionally, the `calendar-sync` function references a `source` column (`.eq("source", "google")` and `source: "google"` in inserts) that does not exist on the table. These references need to be removed to prevent silent failures in the delete step.

## Technical Details

### File: `supabase/functions/scheduled-calendar-sync/index.ts`
- Line ~170: Change `.insert(eventsToInsert)` to `.upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' })`
- Broaden the delete to remove all existing events for the instructor in the time range (already correct)

### File: `supabase/functions/calendar-sync/index.ts`
- Lines ~588-589: Remove `.eq("source", "google")` from the delete query (column does not exist)
- Lines ~599: Remove `source: "google"` from the insert objects
- Line ~606: Change `.insert(eventsToInsert)` to `.upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' })`
- Lines ~700-701: Remove `.eq("source", "google")` from the delete query
- Line ~712: Remove `source: "google"` from the insert objects
- Line ~717: Change `.insert(eventsToInsert)` to `.upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' })`

These changes ensure that recurring events or events that span past-to-future do not cause the entire batch to fail silently.
