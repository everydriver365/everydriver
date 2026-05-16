## What the user is calling out

There are 5 overlapping availability paths. Two already share `resolveAvailability` from `src/lib/availabilityEngine.ts`; three reinvent the wheel — and those are the ones that have been producing wrong results (Ken's 2 Jun, course discovery, etc.).

| Path | Used by | Engine? | Status |
|---|---|---|---|
| `availabilityEngine.resolveAvailability` (frontend) | `useRealGapSlots`, `useInstructorAvailabilitySearch` | ✅ canonical | keep |
| `supabase/functions/_shared/availabilityEngine.ts` | `create-booking` server guard | ✅ literal mirror | keep (mirror) |
| `LessonScheduler.getAvailableTimeSlots` (`/book/:id`) | public booking page | ❌ bespoke | **replace** |
| `autoScheduler.findOptimalSlots` | course auto-schedule | ❌ bespoke | **replace** |
| `courseAvailability.hasInstructorAvailabilityOn` | `/courses` discovery | ❌ private window math | **replace** |

All five must:
1. Consume the same inputs: `instructor_working_hours`, `instructor_date_overrides`, `instructor_calendar_events` (via `get_public_instructor_calendar_blocks`), `instructor_manual_blocks` (via `get_public_instructor_manual_blocks`).
2. Never read `scheduled_lessons` (already a core rule — every booking writes to GCal, so calendar = truth).
3. Apply the same rules: weekly/override windows → subtract calendar busy (skip all-day-like) + manual blocks → apply instructor buffer + first-lesson travel buffer → snap to `slot_increment_minutes` → respect `allowed_lesson_lengths`.

## Plan

### 1. Single shared loader (new file)

Create `src/lib/availabilitySources.ts` — the only place that fetches the 4 sources for one instructor over a date range:

```
fetchInstructorAvailability(supabase, instructorId, fromDate, toDate)
  → { workingHours, overrides, calendarEvents, manualBlocks, prefs }
```

Used by everything client-side. Edge equivalent at `supabase/functions/_shared/availabilitySources.ts` reusing the same RPCs.

### 2. Single shared "compute slots for a day" wrapper

Add `computeDaySlots(date, sources, options)` to `src/lib/availabilityEngine.ts` that:
- builds the working window from overrides/weekly hours,
- converts GCal + manual blocks to `TaggedConflict[]` via existing `buildDayConflicts`,
- calls `resolveAvailability` once,
- returns `{ slots, rejected, window }`.

This becomes the *only* slot generator anywhere.

### 3. Rewrite the three bespoke callers

**a. `src/components/booking/LessonScheduler.tsx`**
- Drop `getAvailabilityForDate`, `getAvailableTimeSlots`, `conflictsWithExternalEvents`, `addMinutesToTime`, `TIME_SLOTS`, etc.
- Fetch via `fetchInstructorAvailability`.
- For each visible date in the calendar grid call `computeDaySlots`.
- Render `slots` as buttons; `rejected` drives the "why is this greyed out" tooltip (we already have `describeReason`).

**b. `src/utils/autoScheduler.ts`**
- Replace the whole day loop with `computeDaySlots` per day, then score the returned slots.
- Remove `ScheduledLesson` type, custom `blockedSlots` math, all parallel RPCs (now via shared loader).

**c. `src/lib/courseAvailability.ts`**
- `hasInstructorAvailabilityOn(date)` becomes `computeDaySlots(date, …).slots.length >= 1 && totalFreeMinutes ≥ MIN_FREE_MINUTES`.
- Drop the private `Window`/`subtractIntervals` helpers (engine already does this).
- Network-placeholder branch keeps its synthetic windows but routes through the same engine.

### 4. Keep the edge engine an exact mirror

Add a CI-friendly check (`scripts/check-engine-mirror.sh`) that fails if `src/lib/availabilityEngine.ts` ≠ `supabase/functions/_shared/availabilityEngine.ts` (modulo Deno import header). Stops the two from drifting again. Note: it's a check, not auto-copy, because Deno needs `.ts` extensions on imports.

### 5. Delete dead code

- `src/lib/availabilityCore.ts` is a thin wrapper that just re-exports engine types — collapse its 2 used consumers to import from `availabilityEngine` directly, then delete the file.
- Remove the now-unused `addMinutesToTime`, `TIME_SLOTS`, `ExternalCalendarEvent` interface duplicates spread across components.

### 6. Verification

After the refactor, with Ken (`c9843b58-…`), 2h slots, 10:30–16:00 Tue working hours, no real conflicts in window:
- `/book/c9843b58-…?hours=10&date=2026-06-19` → 2 Jun shows **10:30, 11:00, 11:30, 12:00, 12:30, 13:00, 13:30, 14:00** (8 slots).
- `/courses` → Ken's card is **available** for that date.
- `useRealGapSlots` (instructor portal) → same 8 starts.
- `create-booking` accepts any of those slots and rejects 09:00 / 14:30 (no time).

All four answers come from the same `resolveAvailability` invocation pattern, so they cannot disagree.

## Out of scope

- DB-side `get_public_scheduled_lesson_blocks` RPC stays in the database (still used by reporting/CRM screens like `AdminBookingsManager`).
- Pricing, payment, GCal write-back logic — unchanged.
- Mobile-specific layouts — unchanged (per project rule).