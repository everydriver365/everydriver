## Goal

Make Find Slot use the **same buffer + travel padding logic** that the Fill Gaps system uses, so a slot is never offered if it would breach the instructor's lesson buffer or eat the travel-time allowance against an existing lesson, manual block, or Google Calendar event.

## What changes

Single file: `src/hooks/useInstructorAvailabilitySearch.ts`.

1. **Fetch `buffer_minutes` per instructor** — extend the `instructors` query select to include `buffer_minutes`. Build a `Map<instructorId, bufferMinutes>` (default 0 when null).

2. **Apply the same padding rule as `useRealGapSlots`**:
   - `TRAVEL_FALLBACK_MIN = 10`
   - `padMin = bufferMinutes + TRAVEL_FALLBACK_MIN` per instructor.
   - When testing collision, inflate every conflict window by `padMin` on each side:
     ```ts
     const collides = conflicts.some(
       (c) => s < c.end + padMin && e > c.start - padMin
     );
     ```
   - This single change covers lessons, manual blocks, and Google Calendar events (they all live in the same `conflicts` array).

3. **Respect day boundaries** — keep the existing `s + durationMinutes <= dayEndMin` guard so padding doesn't push the slot past working hours. The slot itself still fits inside the working window; only the *neighbouring* commitments grow.

4. **Cache key** — include `bufferMinutes` indirectly via the existing `instructorIds` key (per-instructor value is fetched fresh each query, so no extra key needed).

5. **No UI changes**; Find Slot, modal, and page versions automatically inherit the new behaviour.

## Out of scope

- Travel time computed from actual postcode-to-postcode distance (current Fill Gaps also uses a flat 10-min fallback — keep parity).
- Pupil-context filtering (Slot type / Languages / Location dropdowns stay visual until a pupil context is wired in).
- Mobile layouts.

## Result

Find Slot, the admin modal, and the school modal will all return the same set of slots that Fill Gaps would consider valid — no slot is shown that touches another lesson, block, or Google Calendar entry within `buffer + 10 min` on either side.
