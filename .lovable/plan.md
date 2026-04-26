## Problem

When booking a new lesson via `AddLessonSheet`, the conflict warning sometimes doesn't appear even when there's a clear clash. Three gaps in the current logic:

1. **Google Calendar events are ignored.** Only `scheduled_lessons` for the current instructor are scanned. Synced events from `instructor_calendar_events` (Google Calendar busy blocks, manual blocks, courses, holidays) are not checked, so a new lesson can be booked right on top of one.
2. **Back-to-back lessons don't always warn.** If `bufferMinutes` is 0 (instructor hasn't configured a buffer), a lesson that starts the exact second another ends produces `newStart < existingEnd` = false, so no overlap is reported — even though there's zero gap to drive.
3. **Save debounce race.** The conflict check is debounced ~400ms. Pressing Save before it lands lets the booking through because `conflictWarning` is still `null`.

## Fix

All changes in `src/components/instructor/AddLessonSheet.tsx`. No DB changes.

### 1. Include Google Calendar / external events in the scan

Alongside the existing `scheduled_lessons` query, also fetch from `instructor_calendar_events` for the same instructor and date window:

```text
- where instructor_id = current
- where start_time/end_time intersect the chosen lesson_date (UTC → local day window)
- where is_busy = true   (free/transparent events don't block)
```

Convert each event's `start_time`/`end_time` into local minutes-from-midnight (matching how `scheduled_lessons` are compared), and feed them into the same buffered-overlap loop. Label them by `title` (fallback "Calendar event") in the warning message, e.g. `Overlaps with WDU Course` or `Too close to Dentist (needs 15 min buffer)`.

The same merged list also feeds the previous/next lookup for the travel-time check, so travel from a Google event's `location` postcode is considered when present (skip travel check if no postcode can be parsed from the event).

### 2. Always enforce a minimum gap (even when buffer = 0)

Treat `effectiveBuffer = max(bufferMinutes, 1)` for the overlap test only, so a brand-new lesson starting at exactly the same minute another ends still trips the warning ("Too close to … — back-to-back"). The actual configured buffer is still used in the displayed message and travel maths.

### 3. Close the Save debounce race

In both `handleAddLessonExisting` and `handleAddLessonNew`, before the existing `if (conflictWarning && !overrideBuffer)` guard:

- If `checkingConflict === true`, await a small promise that resolves when the in-flight check finishes (track with a ref to the latest check's promise).
- Then re-read `conflictWarning` and apply the guard.

This guarantees Save can never bypass a pending check.

### 4. Render tweak

The warning banner already shows `conflictWarning` text and the "Override buffer / Book anyway" link — no UI change needed; it'll just trigger more often and with clearer source labels.

## Out of scope

- Other instructors' lessons in a multi-instructor school (separate feature).
- Reschedule sheet (already correct per earlier review).
- Any DB migrations.

## Files touched

- `src/components/instructor/AddLessonSheet.tsx` — extend conflict scan to include `instructor_calendar_events`, enforce minimum 1-minute gap, await in-flight check on Save.
