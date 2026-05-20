## Goal
Eliminate the two real risks surfaced by the engine audit:
1. A misleading comment in the legacy wrapper that misrepresents buffer padding.
2. The create-booking edge function's hand-rolled availability layer diverging from the browser engine — most importantly **letting past slots pass server-side**.

The engine twin itself is logically identical to the browser engine; no changes needed there.

## Scope

### A. Fix the wrapper comment (trivial)
File: `src/lib/availabilityCore.ts` (lines ~24–27, plus the const it precedes).

Replace the false claim with the truth:
- Delete `// Engine now applies travel padding (10 min) on top of bufferMinutes.` and the two-line continuation.
- Replace with: `// Engine applies bufferMinutes only — no hidden travel padding. TRAVEL_FALLBACK_MIN re-exported as 0 for legacy callers that did "bufferMinutes + TRAVEL_FALLBACK_MIN" by hand.`
- Leave the `export const TRAVEL_FALLBACK_MIN = 0;` and `ENGINE_TRAVEL_PADDING` lines untouched — runtime is correct.

No behaviour change. Pure documentation correction.

### B. Close create-booking guard drift
File: `supabase/functions/create-booking/index.ts` (lines ~93–210).

Five targeted edits, no rewrite of the surrounding flow:

1. **Pass past-cutoff inputs to `validateSlot`** (highest priority).
   - Import `londonTodayStr` from `_shared/availabilityEngine.ts`.
   - In the per-slot loop, derive `const isToday = slot.date === londonTodayStr();`.
   - Read instructor `min_lead_hours` in the same `instructors` select as `buffer_minutes`; compute `minNoticeMinutes = Math.max(0, Math.round(Number(min_lead_hours ?? 0) * 60))`.
   - Pass both into `validateSlot({ ..., isToday, minNoticeMinutes })`.
   - Result: server rejects a slot that is already past in London or inside the instructor's notice window, matching the browser engine.

2. **Add `available_from` gate.**
   - Add `available_from` to the `instructors` select.
   - Before the per-slot loop, if `available_from` is set and parses to a date `> londonTodayStr()` for **any** requested slot whose date is earlier than `available_from`, push a `Date is before instructor's available-from` conflict and skip the engine call for that slot.

3. **Merge working windows before containment check.**
   - Import `mergeIntervals` (already exported by the twin).
   - After building `matching`, map to `{ start: toMinutes(w.start_time), end: toMinutes(w.end_time) }`, run `mergeIntervals(...)`, then do the containment search against the merged list. Use the merged window's `start`/`end` for `winStart`/`winEnd`.

4. **Fail-closed `is_busy` parity.**
   - Drop the `.eq("is_busy", true)` SQL filter so `is_busy = null` rows reach `buildDayConflicts`, which treats them as busy (matching the browser).
   - Keep the time-range filter unchanged.

5. **Switch DOW derivation to `londonDow`.**
   - Import `londonDow` from the twin.
   - Replace `const dow = new Date(\`${slot.date}T00:00:00Z\`).getUTCDay();` with `const dow = londonDow(new Date(\`${slot.date}T12:00:00Z\`));`.
   - Functionally equivalent today, eliminates the silent-break risk if a future caller passes an instant. Removes the parallel "what convention?" question.

No change to the engine itself, the wrapper, or the browser code paths beyond Step A.

## Out of scope (for this plan)
- The "next free slot" widget end-to-end trace — agreed earlier to do this after the twin work.
- Any refactor pulling create-booking's window resolution into a shared `_shared/courseAvailability.ts` (the right long-term move, but bigger than this fix and not necessary for correctness).
- Adding tests; the Deno test runner is available and we should follow up, but the user did not request it.

## Verification
- After Step A: re-read the comment block; no behaviour to test.
- After Step B: deploy `create-booking`, then run the existing Deno tests (if any) plus a manual `curl_edge_functions` POST with:
  - a slot in London-past on today → expect `SLOT_UNAVAILABLE / Slot is in the past`.
  - a slot before the instructor's `available_from` → expect the new conflict reason.
  - a 60-min slot bridging two adjacent working-hour rows → expect success (currently fails).
- Spot-check edge function logs (`edge_function_logs`) for the new `Slot is in the past` rejection appearing on stale-tab attempts.

## Risk
- Step B item 4 (removing `is_busy` SQL filter) slightly increases rows fetched per request. Negligible — already date-scoped, instructor-scoped.
- Step B item 1 makes the server stricter. A pupil whose browser submits a stale booking will now see `SLOT_UNAVAILABLE` instead of a confirmation that later collides. This is the intended behaviour and matches what the UI already promises.
