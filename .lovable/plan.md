## Goal

Make the expanded view part of the **same** Next-Lesson tile so toggling "Details" reveals extra content **inside** the existing card with no visible gap or layout swap.

## Problem today

`NextLessonPreviewCard` currently renders **two completely different layouts** depending on `expanded`:

- **Collapsed** (lines 390–670): the new redesigned tile — header with 38px time hero, 60px map strip, details rows, action buttons, "Details" handle.
- **Expanded** (lines 672–1205): a totally separate layout — taller map at the top, large pupil row, lesson rows, then an extras block (pupil, stats, payment, notes).

The "swap" looks like the tile disappears and a different tile appears beneath, which is the gap the user is seeing.

## Fix

Keep the redesigned collapsed tile as the **single canonical layout**. When `expanded === true`, render an **extras panel inside the same card**, directly below the action buttons and above the bottom "Details / Hide details" handle. Smooth height animation (framer-motion `AnimatePresence`, matching `UpNextCard`).

```text
┌── Up next card ──────────────┐
│ Header band (time hero)      │
│ Map strip (60px)             │
│ Lesson type row              │
│ Pickup row                   │
│ AI divert pill (if any)      │
│ [Call] [Text] [Go]           │
│ ─────── (only when expanded) │
│ • Pupil mini row + View      │
│ • Stats grid (Lessons /      │
│   Last lesson / Test booked) │
│ • Payment pill + balance     │
│ • Notes from last lesson     │
│ ──────────────────────────── │
│  Details ▾  /  Hide details ▴│
└──────────────────────────────┘
```

## Implementation details

- Delete the entire separate "expanded" return block (lines ~672–1205).
- Single `return` always renders the redesigned card. Bottom handle text/icon toggles via `expanded` state (already wired).
- Insert an `AnimatePresence` block between the action-buttons row and the bottom handle, identical pattern to `UpNextCard.tsx`:
  - `motion.div` with `initial/animate/exit` on `height` + `opacity`, `overflow: hidden`.
  - Inner padding `12px 12px 10px`, top border `0.5px solid rgba(0,0,0,0.06)`.
- Move the existing extras content (Pupil mini row, Stats grid, Payment pill, Notes) into that motion block, keeping the existing hooks `usePupilLessonHistory` / `usePupilPaymentStatus` (already only fetched when `expanded`).
- Drop the obsolete top date chip, large pupil header, large lesson/address rows, and `ActionBtn` sub-component (no longer used). Keep `SectionLabel` and `Stat` helpers.
- Map height stays **60px** in both states (no jump). Remove `COLLAPSED_MAP_H` / `EXPANDED_MAP_H` and the `mapH` variable.

## Files

- `src/components/instructor/NextLessonPreviewCard.tsx` — restructure return so a single tile hosts both states; add `AnimatePresence` extras block; remove dead code.

Optional follow-up (not in this plan): apply the same single-tile pattern to `UpNextCard` only if the user reports the same gap on the imminent-lesson variant — it already uses `AnimatePresence` inside the card, so it should be fine.

## Constraints

- No changes to data hooks, handlers (`onCall`, `onText`, `onGo`, `openProfile`), or props.
- No changes to `InstructorMobileHome` wiring or `useNextLessonDetails`.
- Map component, route fetching and ETA logic untouched.
