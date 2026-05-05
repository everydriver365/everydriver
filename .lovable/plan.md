## Goal
Let the instructor preview exactly which lessons will be **created**, **updated**, or **deleted** on Google Calendar before the next sync runs.

## What "to be synced" means
Every lesson change pushes a row into the existing `calendar_sync_queue` table (`action ∈ {syncLesson, deleteLesson}`, `processed_at IS NULL` while pending). The cron job then calls Google. So the preview is simply: read the pending queue rows for the current instructor and classify them.

## New component
`src/components/instructor/CalendarSyncPreview.tsx`
- Fetches in one round trip:
  - `calendar_sync_queue` where `instructor_id = me` and `processed_at IS NULL`, joined with the related `scheduled_lessons` rows (id, lesson_date, start_time, duration_minutes, status, google_event_id, pickup_location, pupils(name)).
- Classifies each pending row:
  - `action='deleteLesson'` OR (`syncLesson` + `status='cancelled'` + `google_event_id`) → **Delete**
  - `syncLesson` + `google_event_id` present → **Update**
  - `syncLesson` + no `google_event_id` → **Create**
- Renders three grouped sections (Create / Update / Delete) inside a `<Dialog>` with badge counts, each row showing pupil name, date/time, duration, and pickup location.
- Empty state: "Nothing pending — your calendar is up to date."
- Footer buttons:
  - **Refresh** (re-runs the query)
  - **Sync Now** — triggers existing `syncExternalEvents()` (incoming) + invokes `process-calendar-queue` for outgoing pending items, then re-queries.
  - **Close**

## Hook into existing UI
In `GoogleServiceAccountSetup.tsx` (connected state, alongside Sync Now / Reconnect / Disconnect), add a **Preview Sync** button that opens the new dialog. No mobile changes.

## Out of scope
- No schema or edge function changes (queue + process-calendar-queue already exist).
- Inbound (Google → app) preview not included — those events come from `fetchExternalEvents` which already provides counts after the fact, and a true pre-fetch diff is what `resyncRange` already does (already exposed via `CalendarResyncRangePanel`).
