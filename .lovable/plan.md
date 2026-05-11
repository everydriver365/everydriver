## Problem

Every text element in `MobileHomeRedesign.tsx` is hard-coded to `fontSize: 14` — all 39 inline font sizes are identical. This flattens the visual hierarchy across the home page tiles: pupil names, start times, countdowns, eyebrow labels, body text, button labels and section headings all render at the same size.

## Goal

Restore a clear, consistent type hierarchy across the home page tiles (Next Lesson card, Up Next strip, action rows, AI pill, Details toggle, all secondary tiles) using the iOS-premium scale already used elsewhere in the instructor app.

## Type scale to apply

| Role | Size | Weight | Examples |
|---|---|---|---|
| Hero number | 28 | 700 | Start time on Next Lesson card |
| Title | 17 | 700 | Pupil full name, tile titles |
| Body | 14 | 600 | Detail rows (lesson type, pickup line) |
| Button label | 15 | 700/600 | Call / Text / Go buttons |
| Caption | 13 | 500 | Day text, countdown, "Pick-up" sublabel, button-row meta |
| Eyebrow / micro | 11 | 600 | "Details" toggle, AI pill, count chips |
| Avatar initials | 16 | 700 | Avatar fallback text |

## Changes (all in `src/components/instructor/MobileHomeRedesign.tsx`)

1. **Next Lesson card header (lines ~609–635)**
   - Avatar initials → 16
   - Pupil name → 17
   - Day/relative-day caption → 13
   - Start time → 28 / lineHeight 30
   - Countdown → 13

2. **Detail rows (lines ~651–675)**
   - "Standard lesson · Xh" → 14
   - Pickup postcode/location → 14
   - "Pick-up" sublabel → 11 uppercase

3. **AI status pill (line ~694)** → 11, weight 600

4. **Action buttons Call/Text/Go (lines ~711, 733, 755)** → 15

5. **Details toggle (line ~788)** → 12

6. **Other tiles (lines ~119, 169, 180, 255, 285, 295, 385, 422, 434, 961, 977, 997, 1099, 1110, 1182, 1189, 1207, 1223, 1257, 1258, 1354, 1361, 1368, 1376, 1712, 1728)**
   - Tile title → 17 / 700
   - Tile value (numbers like counts, mph, £) → 22 / 700
   - Body line → 14 / 500–600
   - Subtitle / muted line → 13 / 500
   - Eyebrow / chip / "all clear" caption → 11 uppercase

   Each will be inspected in context (4-tile grid, list rows, empty state) and slotted into the scale above — no new colours, layouts or behaviour will change.

## Out of scope

- No layout/spacing changes (only `fontSize`, and `lineHeight`/`fontWeight` where required for the new size to sit correctly).
- No edits to other home-page children (`HomeGreeting`, `TodayOverviewStrip`, `WarmHomeTiles`, `Schedule`) — they already use a varied scale.
- No design-token refactor; sizes stay inline to keep the diff minimal and focused.

## Verification

Reload `/instructor` at 390×844 and confirm: pupil name reads larger than the day caption, start time dominates the header, button labels feel tappable but not shouting, eyebrows look like eyebrows, and the four secondary tiles share a consistent title/value/caption rhythm.
