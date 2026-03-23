

## Fix: Google Calendar Double Bookings

### Root Cause

The `process-calendar-queue` function has no deduplication. When multiple queue entries exist for the same lesson (which happens when a lesson is inserted and then immediately updated, or when both the cron job and `confirm-booking` trigger processing simultaneously), each entry creates a **separate Google Calendar event** because:

1. Queue entry #1 processes: lesson has no `google_event_id` → creates new event, saves ID
2. Queue entry #2 processes concurrently or before #1's update is committed → also sees no `google_event_id` → creates another new event

### Fix (2 changes)

#### 1. Deduplicate queue before processing (`process-calendar-queue/index.ts`)

Before processing, group queue items by `lesson_id` and only process the **latest** entry per lesson. Mark older duplicates as processed immediately.

#### 2. Add idempotency check before creating events (`process-calendar-queue/index.ts`)

Before creating a new Google Calendar event, re-fetch the lesson's `google_event_id` to check if another queue item already created one. If it exists, update instead of create.

### Technical Details

**File: `supabase/functions/process-calendar-queue/index.ts`**

- After fetching queue items (line 225-230), deduplicate by `lesson_id` — keep only the latest entry per lesson, mark the rest as processed
- Before `createGoogleEvent` (line 329), re-read `google_event_id` from the database as a fresh check to avoid race conditions
- This prevents both the "multiple queue entries" and "concurrent processing" scenarios

### No database changes needed

The existing schema is fine. The fix is purely in the edge function logic.

