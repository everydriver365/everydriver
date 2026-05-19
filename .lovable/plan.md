## Goal
On the instructor portal home dashboard (`/instructor`, desktop), split the middle column of the main grid so a new **Next Lesson** tile sits above a reduced-height **DVSA Standards Check** tile.

## Where
`src/components/instructor/dashboardV3/HybridDashboard.tsx` — the 3-column grid at ~line 583:

```text
[ Schedule ] [ DVSA Standards ] [ Earnings ]
```

Becomes:

```text
                ┌────────────────┐
[ Schedule ]    │  Next Lesson   │   [ Earnings ]
                ├────────────────┤
                │ DVSA Standards │ ← reduced ~50% height
                └────────────────┘
```

## Changes

1. **New `NextLessonCard` component** in the same file (matches existing `DvsaStandardsCard` / `EarningsCard` style: white bg, 12px radius, navy header chip).
   - Data source: existing `useNextLessonDetails(instructorId)` hook (already in project).
   - Shows: pupil name + avatar initial, lesson date/time (e.g. "Today 14:00" / "Tomorrow 09:30"), duration, pickup postcode, status pill.
   - Empty state: "No upcoming lessons" with a "Schedule one →" link to `/instructor/diary`.
   - Click the card → navigate to the lesson detail / diary.
   - Loading: shimmer placeholder consistent with iOS Consistency memory.

2. **Reduce DVSA Standards card height by ~half**:
   - Header padding `11px 14px` → `8px 12px`.
   - Body padding `16px 14px` → `10px 12px`; empty-state padding `28px 16px` → `14px 12px`.
   - Drop the description paragraph in the empty state; keep icon + "Log a result" button on a single compact row.
   - Result value font `20px` → `16px`; date font unchanged.

3. **Grid restructure** at line 583:
   - Wrap Next Lesson + DVSA in a vertical flex (`display: flex; flexDirection: column; gap: 10`) so they share one column.
   - Keep the outer grid `1fr 1fr 280px` unchanged.

## Live data rules
- Use `useNextLessonDetails` (or equivalent query already in the codebase) — no hard-coded fallbacks (per Core memory).
- Time formatting: Europe/London via existing `toLondonParts` helpers.
- Imperial: not relevant here (no distances rendered).

## Out of scope
- Mobile dashboard layout (per Mobile update policy).
- Any backend/schema changes.
- Restyling Schedule or Earnings cards.
