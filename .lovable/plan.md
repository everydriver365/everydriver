
# Fix: Google Calendar Sync - Complete Reliability Overhaul

## Current State After Investigation

The upsert fix from the last change **is now working** -- I triggered the scheduled sync and confirmed 124 future events were stored (up to May 2026). However, several critical problems remain that make the sync unreliable and incomplete.

## Problems Found

### 1. No Google API Pagination (maxResults: 250)
All three sync functions (`scheduled-calendar-sync`, `calendar-sync`, `google-calendar-service`) hard-cap at 250 results with **no pagination**. If an instructor has more than 250 events in 365 days, future events are silently dropped. Google Calendar API uses `nextPageToken` for pagination -- this is completely ignored.

### 2. The `google-calendar-service` Function Uses `insert()` Not `upsert()`
Line 553-555 of `google-calendar-service/index.ts` still uses `.insert(eventsToInsert)`. This will fail on duplicate `external_event_id` values, silently losing events. The `fetchExternalEvents` action also generates fake `external_event_id` values (`google-busy-${index}-${Date.now()}`), meaning every sync creates new rows instead of updating existing ones, causing duplicates.

### 3. The `sync-all-calendars` Function Calls Non-Existent Function
`sync-all-calendars/index.ts` invokes `google-calendar-sync` (line 45) which does not exist as an edge function. It should call `google-calendar-service` with `fetchExternalEvents`.

### 4. No Error Logging on Upsert/Insert Failures
The `scheduled-calendar-sync` function does not check for errors after the upsert call (line 196). Silent failures go undetected.

## Plan

### Step 1: Add Google API Pagination to All Sync Functions

In `scheduled-calendar-sync/index.ts` and `calendar-sync/index.ts`, modify the `fetchGoogleEvents` function to loop through `nextPageToken` pages until all events are fetched. Remove the `maxResults: "250"` cap or increase it to 2500 (Google's max per page).

### Step 2: Fix `google-calendar-service` to Use Upsert with Stable IDs

In `google-calendar-service/index.ts`:
- Change the `fetchExternalEvents` action to fetch actual calendar events (with real Google event IDs) instead of using the freeBusy API which only returns time blocks with no IDs
- Use `.upsert()` instead of `.insert()` with `onConflict: 'instructor_id,external_event_id'`
- This gives proper event titles and stable external IDs for deduplication

### Step 3: Fix `sync-all-calendars` to Call the Correct Function

Update `sync-all-calendars/index.ts` to invoke `google-calendar-service` instead of the non-existent `google-calendar-sync`.

### Step 4: Add Error Handling on All DB Write Operations

Add error checking after every upsert/insert/delete in all three sync functions and log failures.

## Technical Details

### `supabase/functions/scheduled-calendar-sync/index.ts`
- Modify `fetchGoogleEvents`: add `nextPageToken` loop, increase `maxResults` to `2500`
- Add error checking after upsert call on line 196
- Log event count per page for debugging

### `supabase/functions/calendar-sync/index.ts`
- Same pagination fix for `fetchGoogleEvents`
- Add error checking after upsert calls

### `supabase/functions/google-calendar-service/index.ts`
- Replace `fetchBusyTimes` call in `fetchExternalEvents` action with a proper `events.list` API call that returns event IDs and titles
- Change `.insert()` to `.upsert()` with conflict handling
- Add pagination support

### `supabase/functions/sync-all-calendars/index.ts`
- Change `google-calendar-sync` to `google-calendar-service` on line 45

All four functions will be redeployed after changes.
