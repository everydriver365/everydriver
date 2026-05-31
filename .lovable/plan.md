## Goal

Add a third segmented pill — **Next** — to the home `ScheduleTile` alongside Today / Tomorrow. The Next tab shows the next 5 upcoming lessons (after tomorrow) in a vertically scrollable list, styled identically to existing lesson rows but with the lesson date shown in place of the duration sub‑label.

## Changes

### 1. `src/components/instructor/ScheduleTile.tsx`
- Add `"next"` to the tab state union.
- Accept a new prop `nextLessons: Lesson[]` (pre-sorted, max 5) from the parent.
- Add a third pill rendered via `renderPill` — label `Next`, no date suffix (uses generic styling, e.g. `Next / 5`).
- Replace the 2-pill flex row with 3 pills (equal `flex-1`).
- When `tab === "next"`:
  - Section label: `Next ${n} lesson${...}`.
  - Render the same row component, wrapped in a scrollable container: `maxHeight: 260, overflowY: "auto", WebkitOverflowScrolling: "touch"`, with `overscrollBehavior: "contain"`.
  - Each row shows the lesson date (`MON 3 JUN`) in the small grey sub-label below the time instead of duration, so the user can distinguish days while scrolling.
- Remove the top-right "Next Lessons" text link + `onViewNext` usage (now replaced by the tab). Keep prop optional for backward compat but unused.

### 2. `src/components/instructor/MobileHomeDSM2026.tsx` — `ScheduleCard`
- Add a new query (inline `useQuery` or small hook) fetching upcoming lessons starting from the day after tomorrow:
  - `scheduled_lessons` where `instructor_id = ...`, `deleted_at is null`, `status != cancelled`, `lesson_date >= dayAfterTomorrow`, order by date/time asc, limit 5.
  - Join `pupils:pupil_id(name)` for `studentName`.
- Map to the `Lesson` shape (`startTime` = `lesson_date + 'T' + start_time`, `endTime` derived from duration).
- Pass `nextLessons` to `<ScheduleTile />`.
- Remove the `NextLessonsSheet` mount and `nextOpen` state (no longer needed).

### 3. Leave `NextLessonsSheet.tsx` in place but unused
- No deletion in this change to keep the diff minimal; can be removed later if confirmed unused elsewhere.

## Notes
- All styling reuses existing `C` palette constants and the same row markup — no design tokens changed.
- Scroll container only applied on the Next tab; Today/Tomorrow continue to render their natural height.
- 5-lesson cap enforced at query level so the scrollable region is bounded and predictable.
