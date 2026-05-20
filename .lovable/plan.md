## Five scoped fixes to the availability engine

Apply to both copies (browser + edge function shared) so they stay logically identical. No type signatures change. Fail-closed behaviour preserved. Supabase data loader untouched.

### Files

- `src/lib/courseAvailability.ts` — fixes 1, 5
- `src/lib/travelTime.ts` — fix 2
- `src/lib/availabilityEngine.ts` — fixes 3, 4
- `supabase/functions/_shared/availabilityEngine.ts` — mirror fixes 3, 4

### 1. Day-of-week normalization (`courseAvailability.ts`, `getWeeklyWindows`)

- Add a top-level helper:
  ```ts
  function normalizeDow(raw: unknown): number | null {
    if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
    if (raw === 7) return 0;          // ISO Sun → JS Sun
    if (raw >= 0 && raw <= 6) return raw;
    return null;                       // malformed → drop row
  }
  ```
- In `getWeeklyWindows`, iterate both `workingHours` and `availabilityWindows` using a single equality check: `normalizeDow(w.day_of_week) === jsDow`. Rows that normalize to `null` are skipped.
- Remove the `winDow = jsDow === 0 ? 7 : jsDow` block and the dual `(w.day_of_week !== winDow && w.day_of_week !== jsDow)` test.

### 2. Travel time at same location (`travelTime.ts`, `estimateDriveMinutes`)

- After computing `miles = haversineMiles(from, to)`, short-circuit:
  ```ts
  // ~80 m threshold (0.05 mi) → same address, no handover gap
  if (miles < 0.05) return 0;
  ```
- Leave the rest unchanged; non-zero estimates still include the handover overhead.

### 3. Stale `isToday` guard (`availabilityEngine.ts`)

- In `resolveAvailability`, change the cutoff computation to require the dateStr to match London today:
  ```ts
  const cutoffMin = (isToday === true && input.dateStr === londonTodayStr())
    ? londonNowMin() + Math.max(0, minNoticeMinutes)
    : -1;
  ```
- In `validateSlot`, gate the past check the same way:
  ```ts
  if (isToday === true && input.dateStr === londonTodayStr()) {
    const cutoff = londonNowMin() + Math.max(0, minNoticeMinutes);
    if (startMin < cutoff) return { ok: false, reason: "past" };
  }
  ```
- Mirror in `supabase/functions/_shared/availabilityEngine.ts`.

### 4. Slot grid anchoring (`availabilityEngine.ts`, `resolveAvailability`)

- Keep the internal stepping at `STEP_MINUTES` (15) so the `rejected` list remains complete.
- Compute the grid stride once: `const stride = Math.max(STEP_MINUTES, anchorSkipMinutes ?? STEP_MINUTES);`
- When a candidate would be pushed into `slots`, only push it if `(s - dayStartMin) % stride === 0`. If not on the grid, skip the push (do not mark as rejected — it was free, just off-grid).
- Remove the existing `if (anchorSkipMinutes && anchorSkipMinutes > STEP_MINUTES) { s += anchorSkipMinutes - STEP_MINUTES; }` jump so rejections aren't dropped between grid points.
- Mirror in `supabase/functions/_shared/availabilityEngine.ts`.

### 5. Buffer comparison (`courseAvailability.ts`, `computeDaySlots`)

- Replace `if (firstLessonBuffer > buffer)` with `if (firstLessonBuffer > opts.bufferMinutes)`.
- Delete the now-dead `void buffer;` statement and its trailing comment.
- Leave the `const buffer = …` line (still used elsewhere? — verify; if unused after this change, remove it too).

### Verification

- Re-run `bun run scripts/fuzz-availability-engine.ts` to confirm fail-closed guards still hold.
- Run `bunx vitest run src/lib/__tests__/availabilityEngine.test.ts`; update only fixtures whose expected behaviour the spec explicitly changes (grid anchoring may shift some accepted slots).
