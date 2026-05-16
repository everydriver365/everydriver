## Problem

Across the booking flow we have three places that decide what slots to show / accept, and they don't all check the same things:

| Surface | Working hrs | Overrides | App diary (scheduled lessons) | Google Calendar busy | Manual blocks | Buffer | Travel time |
|---|---|---|---|---|---|---|---|
| Course list "available dates" (`useCourseDiscovery` → `hasInstructorAvailabilityOn`) | yes | yes | yes | yes | **yes** | yes | yes (fallback 10 min) |
| Edge function booking guard (`validateBookingSlot`) | yes | yes | yes | yes | **yes** | yes | yes |
| **Booking slot picker (`LessonScheduler.tsx`)** — what the pupil actually clicks | yes | yes | yes | yes | **NO** | yes | only on first slot of day |

So an instructor can have a manual block (e.g. Ken D blocking 1 June from the instructor app), the courses page correctly hides the date, but if a pupil reaches the time-slot grid via another route they can still see and pick slots that don't really exist. The edge guard then rejects the booking, or — worse — the manual block was set after the slots were fetched and the booking sneaks through.

## Fix

Bring `LessonScheduler.tsx` in line with the shared availability resolver so it checks **all five** conflict sources with the same buffer + travel padding the courses page and the edge guard already use.

### 1. Load manual blocks in `fetchAvailability`
Add a 6th parallel call to the public RPC we already use elsewhere:

```ts
supabase.rpc("get_public_instructor_manual_blocks", {
  p_instructor_ids: [instructorId],
  p_from_datetime: fromIso,
  p_to_datetime: toIso,
})
```

Map each row into the same `{ start_time, end_time }` shape used for `externalEvents` and merge them alongside Google Calendar events + scheduled lessons. (Manual blocks aren't all-day so the existing 24h all-day filter leaves them in.)

### 2. Use the same padding as the rest of the system
Today `conflictsWithExternalEvents` pads only by `bufferMinutes`. The courses page and edge guard pad by `bufferMinutes + 10` (the `TRAVEL_FALLBACK_MIN` constant from `courseAvailability.ts`). Import that constant and add it to `bufferMs` so a slot can't butt up against a Google event/lesson/manual block without the travel allowance.

### 3. Apply travel time as a floor, not just for "first of day"
Right now the travel buffer only blocks the very first slot of the day. Tighten the rule:
- Keep the existing "first of day" travel-from-home check.
- Also reject any slot whose start is within `travelBufferMinutes` of the previous conflict's end (already covered once #2 lands, since `TRAVEL_FALLBACK_MIN` is added on each side — but if `travelBufferMinutes` from `check-travel-buffer` is larger we should use the larger of the two).

### 4. Re-fetch on focus / after booking
Add a `visibilitychange` listener that calls `fetchAvailability()` again when the tab regains focus so a manual block added on the instructor's phone in the last 30 seconds doesn't get missed. (Cheap — one RPC round trip.)

## Out of scope

- No DB / RLS / edge function changes — the public RPCs `get_public_instructor_calendar_blocks`, `get_public_scheduled_lesson_blocks`, `get_public_instructor_manual_blocks` already exist and return exactly the data we need.
- No change to `useCourseDiscovery` or `validateBookingSlot` — those are already correct.
- No styling changes.

## Files touched

- `src/components/booking/LessonScheduler.tsx` (only file)

## Verification

1. As Ken D, add a manual block on a future date in the instructor app.
2. Open the same date in the pupil booking flow — every slot inside the block ± buffer ± 10 min travel must be hidden.
3. Add a Google Calendar event mid-day — surrounding slots within buffer + travel must disappear.
4. Existing scheduled lesson — same behaviour (already working, regression-check only).
