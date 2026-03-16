

## Bug: All-day calendar events not skipped in LessonScheduler (timezone issue)

### Root Cause

The all-day event skip logic in `LessonScheduler.tsx` (line 308-311) uses `eventStart.getHours()` which returns the **local** hour, not UTC. All-day events from Google Calendar are stored as UTC midnight (`2026-06-01 00:00:00+00`). In BST (UTC+1, active in UK during June), `.getHours()` returns **1**, not 0 — so the `startHour === 0` check fails, and the all-day event is treated as a real busy block.

Every day in Ken's June calendar has an all-day event spanning midnight-to-midnight UTC. Since these aren't being skipped, they block **every single time slot**, making all June dates appear unavailable.

### Evidence
- Database confirms all-day events exist for every day in June (e.g. `2026-06-01 00:00:00+00` to `2026-06-02 23:59:59+00`)
- The `StepBookNext` component already handles this correctly by checking `duration >= 24h` instead of relying on `getHours()`

### Fix

**File: `src/components/booking/LessonScheduler.tsx`** (lines 307-311)

Replace the all-day event detection with a duration-based check (matching the pattern used in `StepBookNext.tsx`):

```typescript
// Skip all-day events (duration >= 24 hours — informational, not time-specific blocks)
const diffMs = eventEnd.getTime() - eventStart.getTime();
if (diffMs >= 24 * 60 * 60 * 1000) return false;
```

This removes the `getHours()` dependency entirely and reliably detects all-day events regardless of timezone.

### Scope
- Single file change, 3 lines replaced with 2 lines
- No other files use this flawed pattern (verified via search)

