## Problem

On the instructor mobile home (`/instructor` → `MobileHomeDSM2026` → `ScheduleCard` → `ScheduleTile`), today's lessons all render identically. A lesson whose end-time has passed looks the same as an upcoming one, with no "completed" treatment and no End-of-Lesson (EOL) status — even though that information already exists in the larger `HomeTodaySchedule` component and the `useDayLessonHistory` hook.

## Fix

Wire EOL + past-state awareness into the mobile home schedule tile, matching the convention already used in `HomeTodaySchedule.tsx`.

### 1. `src/components/instructor/ScheduleTile.tsx`

- Extend the `Lesson` interface with two optional fields:
  - `pupilId?: string`
  - `status?: string` (so cancelled rows continue to be respected if passed later)
- Add an optional prop `eolDoneKeys?: Set<string>` (a set of `"{pupilId}|HH:MM:SS"` keys, identical to the format produced by `eolKey` in `useDayLessonHistory`).
- For each lesson row on the `today` tab, compute:
  - `isPast` — `_end.getTime() <= Date.now()`
  - `eolDone` — `pupilId && startTime ⇒ eolDoneKeys.has(pupilId|HH:MM:SS)`; helper inline (no new import needed if we duplicate the tiny normaliser, but preferred: import `eolKey` from `@/hooks/useDayLessonHistory`).
- Apply visual treatment for past rows:
  - Dim row to ~60% opacity, keep tap target working.
  - Replace the blue divider colour with green when `eolDone`, amber when `isPast && !eolDone`.
  - Add a small pill on the right of the info column (before the chevron):
    - `eolDone` → green pill "EOL ✓"
    - `isPast && !eolDone` → amber pill "EOL needed"
  - Colours come from existing tokens used elsewhere (green `#1D9E75`, amber `#D97706`) — kept as inline constants in this file's local `C` palette for consistency with the file's current style.
- Re-tick the component every 30 s (`setInterval` + `useState`) so a lesson rolls into the past state without a manual refresh, mirroring `HomeTodaySchedule`'s tick logic.

### 2. `src/components/instructor/MobileHomeDSM2026.tsx` — `ScheduleCard`

- Pull EOL keys with `useDayLessonHistory(instructorId, today)` (hook is already in the project).
- Pass `pupilId` and `status` through when mapping `todayLessons` / `tomorrowLessons` to the `ScheduleTile` shape (data already present on `useDayLessons` rows).
- Pass `eolDoneKeys` into `<ScheduleTile />`.

### Out of scope

- Tomorrow / Next tabs (no past-state to show).
- Desktop schedule panel (already handled separately).
- Any change to write paths, EOL flow, or DB queries.
- Cancelled-lesson styling — `useDayLessons` already filters `neq("status","cancelled")`.

### Verification

- Reload `/instructor` on mobile viewport with at least one past lesson today.
  - Before EOL run: dimmed row with amber "EOL needed" pill and amber divider.
  - After EOL run: dimmed row with green "EOL ✓" pill and green divider.
- Upcoming lessons unchanged (full opacity, blue divider, no pill).
