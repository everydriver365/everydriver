## Scope

Fixes 1–5 from the prompt are already applied in the engine files (`courseAvailability.ts`, `travelTime.ts`, `availabilityEngine.ts`, plus the edge-function mirror). I re-verified each one — no further edits needed there.

Fix 6 is the only remaining change.

## Fix 6 — Anchor `useRealGapSlots` to London dates

File: `src/hooks/useRealGapSlots.ts`

Problem: the hook builds its 14-day loop from `startOfDay(new Date())` (browser local TZ) and derives each `dateStr` via `londonDateStr(day)`. When the browser TZ differs from Europe/London, day 0's `dateStr` can be yesterday/tomorrow in London terms, so `computeDaySlots` sees `isToday=false` for the actual London-today and skips its past-cutoff. The dashboard then surfaces a slot already in the past.

### Change

1. Drop `startOfDay`/browser-local arithmetic for the day loop. Build the loop index against London calendar dates.
2. Day 0 = `londonTodayStr()`. For each `i in 0..14`, compute the London date string by adding `i` days to that anchor (string-based date math via a UTC noon `Date` to avoid DST ambiguity), then pass a `Date` whose `londonDateStr(...)` returns that same string into `computeDaySlots`.
3. Use the same anchor pair when calling `loadCourseAvailabilitySources` (`fromDate` = a Date that resolves to London day 0; `toDate` = +14 days). Loader signature/behaviour unchanged.
4. `formattedDate` continues to come from `parseISO(dateStr)` — already correct since `dateStr` is now guaranteed London-aligned.

### Technical notes

- Helper (local to the hook):
  ```ts
  const londonDayDate = (offsetDays: number): Date => {
    // Anchor: London today at noon UTC for the (today + offsetDays) date.
    // Noon UTC is safely inside the same London calendar day regardless of
    // BST/GMT, so londonDateStr(returned) === expected yyyy-MM-dd.
    const [y, m, d] = londonTodayStr().split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0));
  };
  ```
- Replace `const fromDate = startOfDay(new Date()); const toDate = addDays(fromDate, 14);` with `const fromDate = londonDayDate(0); const toDate = londonDayDate(14);`.
- Inside the loop: `const day = londonDayDate(i); const dateStr = londonDateStr(day);` — `dateStr` is now identical to what `computeDaySlots` derives internally, so `isToday` matches and the engine's past-cutoff (`londonNowMin() + minNoticeMinutes`) is applied for the genuine London-today.
- Don't touch `loadCourseAvailabilitySources` itself (per the prompt).
- The `nextFreeSlotLabel` memo in `MobileHomeDSM2026.tsx` is already correct; no change there.

## Verification

- Reproduce: set browser TZ to e.g. `Pacific/Auckland`, load the dashboard around the London date boundary, confirm no today-slot earlier than `londonNow + minNotice` appears.
- Spot-check in UK TZ: behaviour unchanged (same dateStrs as before).
- Confirm the timezone in the original bug report's session. If it was already `Europe/London`, this fix is necessary but not sufficient — we'd need to look further (e.g. stale `minNoticeMinutes` source, cache outliving wall clock by more than the 60s refetch).
