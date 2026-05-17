## What is broken

The 18 June rows are not imaginary, but they are stale/junk CRM lesson records:

- They exist in `scheduled_lessons` for Ken on 18 June.
- Seven of them have `google_event_id` values from March, which means they were probably pushed to Google at some point.
- They are **not present** in the current `instructor_calendar_events` mirror for Ken’s live Google Calendar.
- One row is still `awaiting_initial_payment = true` with no Google event, so it should definitely not block availability.
- The database has **no active trigger** on `scheduled_lessons`, so lesson creation/deletion is not automatically guaranteed to stay in sync with Google.
- The current “safety net” incorrectly treats those stale CRM rows as availability-blocking, violating the agreed rule that live availability must come from Google Calendar plus manual blocks only.

## Why this happened

The app has two separate records:

```text
scheduled_lessons = CRM / booking history row
Google Calendar / instructor_calendar_events = live availability source
```

Those rows can drift apart because:

1. Earlier lesson creation paths inserted `scheduled_lessons` rows and then tried to sync to Google separately.
2. If the Google event was later deleted directly in Google, the app’s calendar resync removes it from `instructor_calendar_events` but does **not** currently mark the linked `scheduled_lessons` row cancelled/deleted.
3. Because the last fix made `scheduled_lessons` block public availability directly, stale CRM rows started blocking Ken’s booking calendar even though they are not in his live Google Calendar.

## Fix plan

1. **Revert the availability rule back to the approved source of truth**
   - Remove synthetic busy events created from `scheduled_lessons` in `loadCourseAvailabilitySources`.
   - Keep `scheduled_lessons` geo rows only for optional travel-time padding around confirmed live calendar bookings, not as a busy source.
   - Update comments/memory back to: Google Calendar mirror + manual blocks are the only busyness sources.

2. **Clean Ken’s 18 June junk rows safely**
   - Soft-delete or cancel the eight stale `scheduled_lessons` rows for Ken on 18 June.
   - Also clear/mark any pending queue item tied to the unpaid junk row so it does not later recreate a Google event.
   - This makes the CRM match what Ken’s live Google Calendar already shows.

3. **Prevent deleted Google events from leaving active CRM lessons behind**
   - Update the Google Calendar `resyncRange` flow: when it detects Google event IDs removed from Google, it should also mark matching `scheduled_lessons` rows as cancelled/deleted or at minimum `calendar_sync_status = deleted-from-google`.
   - This keeps future “deleted in Google” lessons from staying active in CRM.

4. **Make lesson sync status truthful**
   - Fix the inconsistency where rows with `google_event_id` still show `calendar_sync_status = pending`.
   - Add logic so successful sync writes `synced`, missing/deleted Google events are not treated as active, and unpaid/awaiting-payment rows never affect availability.

5. **Verify after changes**
   - Query Ken’s 18 June live calendar mirror: only real Google events/manual blocks remain.
   - Query `scheduled_lessons`: the junk rows are no longer active.
   - Check the public booking availability path no longer blocks times solely because stale CRM rows exist.