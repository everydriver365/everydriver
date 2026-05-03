## Goal

Bring the instructor mobile home screen structurally in line with the reference mockup. The previous passes were token-only (radii, shadows, colors) — this pass changes layouts. All live data, handlers, and routes are preserved.

## Scope (one pass, six edits)

### 1. Greeting tiles — add icon medallions
`src/components/instructor/MobileHomeRedesign.tsx` (`GreetingBlock` → `Chip`)
- Replace 8px colored dot with a 32×32 rounded-square medallion (10px radius) holding a Lucide icon.
- Lessons → `Calendar` (blue tint), Today £ → `PoundSterling` (green tint), Waiting → `Clock` (amber tint).
- Bump value to 17px/700.

### 2. Next Lesson hero — split two-column layout
`MobileHomeRedesign.tsx` (`UpNextTile`)
- Switch from stacked (map on top, details below) to a two-column hero matching the reference:
  - Left column: "Next lesson" eyebrow, pupil name, date/time row, lesson type pills (Standard / Manual style chips), postcode + distance row, then full-width Call/Text/Navigate row beneath.
  - Right column (fixed ~150px wide): map preview with floating ETA pill (white card, car icon, "ETA xx min", distance underneath).
- Keep `MapHeroLive` but mount it inside the right column with a fixed aspect.
- Preserve expand/collapse and all click handlers.

### 3. Today's Schedule — vertical timeline rail
`src/components/instructor/MobileHomeBottomSections.tsx` (schedule rows)
- Add a left-side blue timeline: 1px vertical rail with a hollow blue ring per row at the time column.
- Time column shows large time + duration underneath; pupil name bolded; postcode with map-pin icon below.
- Right side keeps the lesson-type pill (Standard / Pass Plus / Motorway colored) and chevron.

### 4. Needs Attention — horizontal 3-tile row
`MobileHomeRedesign.tsx` (`AttentionCard`)
- Replace the grouped Urgent / To do vertical list with three horizontal tiles in a row (icon medallion top-left, two-line label, count badge top-right).
- Drives from the same `attentionRows`: top three by priority. Empty state stays the centered card.

### 5. Bottom nav — centered floating mic
`src/components/instructor/InstructorBottomNav.tsx` (+ `FloatingSessionBar` repositioning)
- Insert a centered slot in the 5-tab nav for a raised circular blue mic button (56×56, gradient #3D55A1, white mic icon, soft shadow, slight upward translate).
- Re-layout nav items: Home, Schedule, [Mic], Track, Pupils, More — mic occupies the middle slot (5 tabs + mic = 6 cells).
- Tap → existing voice/tracking entry (route to `/instructor/tracking` for now; confirm with user post-pass if a different handler is preferred).
- `FloatingSessionBar` stays as-is when an active session exists, but moves above the nav (`bottom-24` instead of `bottom-20`) so it doesn't collide with the raised mic.

### 6. Quick Access — bright rounded-square icon tiles
`MobileHomeBottomSections.tsx` (Quick Access grid)
- Tighten each tile: 56×56 rounded-square (16px radius), bright tint background per category, 22px stroked icon centered, label below at 11px/600.
- Keep current 7-tile order and search bar to the right of the section header.

## Out of scope

- Header bar (DSM logo + bell/+/menu) — already matches.
- Upcoming Events tile — already migrated last pass.
- Any database / hook changes — purely presentational.

## Verification

After edits, take a 390×844 screenshot of `/instructor` and visually compare against the reference. Iterate on spacing only if drift is obvious.