## Goal

Make `availabilityEngine.ts` the only place a slot is ever declared bookable. `courseAvailability.ts` is reduced to a data loader + window shaper. No default availability anywhere — missing data means "not available".

The same edits must be mirrored to the Deno copy at `supabase/functions/_shared/availabilityEngine.ts` (used by `create-booking`) so server and browser stay byte-for-byte logically identical.

---

## Changes

### 1. One clock — Europe/London everywhere
**Wrong now:** `day.getDay()`, `format(day, 'yyyy-MM-dd')`, `startOfDay(new Date())` use server-local time; `clipLondon` uses London; `resolveAvailability` / `validateSlot` "now" cutoffs use `getUTCHours()`. Three clocks → wrong during BST and on any non-UTC host.

**Fix:**
- Add `londonToday()`, `londonDateStr(d)`, `londonDow(d)` helpers in the engine, all built on the existing `toLondonParts`.
- In `resolveAvailability` / `validateSlot`: replace `now.getUTCHours()*60+…` with `toLondonParts(new Date())` → `hour*60+minute`. The `isToday` flag itself must also be derived in London time by the caller.
- In `courseAvailability.ts`: replace every `format(day, "yyyy-MM-dd")`, `day.getDay()`, `startOfDay(new Date())`, `isBefore(day, today)` with the London-based helpers. `dateStr`, `jsDow`, `isToday` and the past-day gate all come from London parts.
- `hasNetworkPlaceholderAvailabilityOn`: same — derive `today`, `dateStr`, `nowMin` from London parts, not `new Date().getHours()`.

### 2. Stop mutating shared `conflicts` inside the window loop
**Wrong now:** `computeDaySlots` pushes "Travel from home" markers into the shared `conflicts` array inside `for (const win of windows)`. The second window of a split shift inherits the first window's phantom buffers.

**Fix:** Build `const winConflicts = [...conflicts]` at the top of each window iteration; push the synthetic "Travel from home" markers into `winConflicts` only; pass `winConflicts` to `resolveAvailability`. The base `conflicts` array is never mutated.

### 3. Merge clipped conflicts before gap pairing
**Wrong now:** The `gapStarts[i] / gapEnds[i]` pairing assumes the clipped conflicts are sorted **and disjoint**. They're only sorted. Two overlapping calendar events (very common when Google + manual block cover the same time) produce mismatched gap pairs and corrupt the first-lesson-buffer logic.

**Fix:** After clipping per-window conflicts, run them through the existing `mergeWindows()` helper (rename it to `mergeIntervals` and reuse) before computing `gapStarts` / `gapEnds`.

### 4. Network-placeholder check uses London time
Covered by change 1 — `hasNetworkPlaceholderAvailabilityOn` switches from `new Date().getHours()` to `toLondonParts(new Date())`.

### 5. Normalize `is_busy` at the data boundary
**Fix:** In `loadCourseAvailabilitySources`, map raw calendar rows to `{ ...row, is_busy: row.is_busy ?? true }` once. Remove the `is_busy: e.is_busy ?? true` patch from `computeDaySlots`. `buildDayConflicts` keeps its existing `if (e.is_busy === false) continue` rule — every consumer now sees the same normalized data.

### 6. `isAllDayLikeEvent` fails closed
**Wrong now:** `catch { return true }` makes a malformed date "informational only" → it stops blocking and the slot looks free.

**Fix:** `catch { return false }` — a malformed event is treated as a real blocking conflict. Also guard the happy path: if `isNaN(s.getTime()) || isNaN(e.getTime())` return `false` (block).

### 7. One HH:MM parser, strict
**Wrong now:** `toMinutes` (engine), `timeToMin` (resolver), `parseHHMMtoMin` (resolver) all parse differently. `parseHHMMtoMin("")` silently returns 0 (midnight) → unparseable lesson times become "midnight" conflicts.

**Fix:**
- Replace `toMinutes` with a single strict `parseHHMM(t: string | null | undefined): number | null` in the engine. Returns `null` for empty / non-numeric / out-of-range input. Export it.
- Delete `timeToMin` and `parseHHMMtoMin` from `courseAvailability.ts`; import `parseHHMM` from the engine.
- Every call site treats `null` as "no data → not available":
  - `getWeeklyWindows`: if either `start_time` or `end_time` is `null` → **skip the row** (no fallback to `DEFAULT_DAY_START`/`END`).
  - `resolveWindowsForDay` override branch: if `start_time || end_time` are present but parse to `null`, or if `is_available` with no times → **return `[]`** (do not synthesize 08:00–20:00, do not fall back to weekly hours).
  - `bookedLessonGeo` loop: if `start_time` parses to `null` → `continue` (skip that lesson's travel padding).
- Remove unused `DEFAULT_DAY_START` / `DEFAULT_DAY_END` constants.

### 8. Strict override behavior (consequence of rule 7 + the user's "no fallback" rule)
- `is_available=false` → `[]` (unchanged).
- `is_available=true` + both times present and parseable → use them (unchanged).
- `is_available=true` + times missing **or unparseable** → `[]`. (Previously fell back to weekly hours or to 08:00–20:00 — now treated as "marked available but no times given", which per the user's rule produces no slots.)

### 9. Type the public RPCs, drop `(client as any)`
Define narrow result types and use `client.rpc<RowType>(...)` so `get_public_instructor_calendar_blocks` and `get_public_instructor_lesson_geo` no longer need `(client as any)`. If the generated `Database` type doesn't include these RPCs, declare a small local `RpcClient` interface and cast `client` to it once at the top of `loadCourseAvailabilitySources` — no `any`. Mention in code comments why.

### 10. Mirror to the Deno copy
Apply changes 1, 2, 3, 5, 6, 7 to `supabase/functions/_shared/availabilityEngine.ts`. Verify `create-booking/index.ts` still compiles against the new exports.

---

## Files touched

- `src/lib/availabilityEngine.ts` — London-time `now`, strict `parseHHMM`, fail-closed `isAllDayLikeEvent`, `mergeIntervals` export, London helpers.
- `src/lib/courseAvailability.ts` — London helpers throughout, per-window conflict copy, merge before gap pairing, strict windows + overrides, normalized `is_busy` at loader, typed RPCs, delete `DEFAULT_DAY_START/END` and the local parsers.
- `supabase/functions/_shared/availabilityEngine.ts` — mirror of the engine changes.
- (No DB schema, RPC signature, or Supabase query changes.)

---

## Behavioral differences after the fix (where instructors will see **fewer** slots)

1. **Instructors with no working hours for a weekday now show zero slots** for that day. Previously a row with `is_active=true` but missing `start_time`/`end_time` silently defaulted to 08:00–20:00.
2. **"Available" date overrides with no times → zero slots** for that date (previously fell back to weekly hours or to 08:00–20:00).
3. **During BST**, "Next free slot" and the booking page will agree with the Google Calendar wall-clock. Previously they could be offset by 60 minutes (slots shown as free during a real Google-busy event, and vice versa).
4. **Non-UTC server hosts**: the "past" cutoff today now matches London wall-clock. Previously a UK 09:30 cutoff could be computed as 14:30 (or earlier) depending on host timezone, blocking morning slots or exposing past ones.
5. **Split shifts**: the second window of a split shift no longer inherits phantom "Travel from home" buffers from the first window — these instructors will see **more** slots in the afternoon window (the only "more slots" case in this PR; it's a bug fix).
6. **Overlapping Google + manual conflicts**: the first-lesson-buffer math is now correct; some previously-emitted invalid slots that overlapped a merged conflict will disappear.
7. **Malformed Google event datetimes** now block their slot instead of being treated as informational. In practice this is rare (Google always sends valid ISO) but it closes a "looks free during a broken sync" hole.
8. **Booked lessons with empty `start_time`** no longer add a midnight travel-padding conflict (previously could block 00:00–dropoff).

---

## Confirmation of invariants

- After this PR, `resolveAvailability` and `validateSlot` are the **only** functions that decide a slot is bookable. `courseAvailability.ts` only loads rows, shapes windows, and forwards everything to the engine.
- No `DEFAULT_DAY_START`/`DEFAULT_DAY_END`, no `??` fallback to invented times, no synthesized availability anywhere. Missing or unparseable data → no slots.
- `scheduled_lessons` is still never consulted for busyness; only `instructor_calendar_events` + `instructor_manual_blocks` (+ optional lesson geo for travel padding).

---

## Open question

The Deno engine at `supabase/functions/_shared/availabilityEngine.ts` is invoked by `create-booking`. Edge functions run in UTC. The fix puts the "today + now" cutoff on London time, which is what users expect — but it **will** start rejecting booking attempts created on a UK device during the last hour before midnight London time if a slot is "in the past" by London clock. I assume this is the desired behavior (it is what users actually mean by "today"). If you'd rather the cutoff stay UTC on the server, say so and I'll thread an explicit `nowInstant: Date` into the engine input so the caller picks the zone.
