

## Plan: Add coloured left accent bars to Next Lesson and Today's Schedule

I'll add a 3px coloured vertical accent bar down the left edge of the Next Lesson tile and each card in Today's Schedule, matching the style used on the section headers and Quick Actions tiles.

### Colour mapping (from DSM palette already in use)

- **Next Lesson** (NextUpTile light-navy tray): navy `#185FA5` — schedule/navigation accent.
- **Today's Schedule** lesson cards (TodayMiniTimeline):
  - "Next" lesson: navy `#185FA5` (matches the existing Next Up emphasis).
  - Upcoming: neutral grey `#5F5E5A`.
  - Done: muted grey `#5F5E5A` at 50% opacity (consistent with the dimmed card).
  - Overdue: red `#A32D2D` (matches the "End lesson" warning).

### Changes

**1. `src/components/instructor/NextUpTile.tsx`**
- Wrap the light-navy tray (the `#E6F1FB` container around line 265) in a flex row that places a 3px-wide, full-height navy bar on its left edge, then the tray content.
- Bar: `width: 3px`, `background: #185FA5`, `borderRadius: 2px 0 0 2px`, sits flush against the tray's left side. Tray's left padding stays the same so internal content doesn't shift.

**2. `src/components/instructor/TodayMiniTimeline.tsx`**
- Each lesson card (currently a single rounded card around line 110) becomes a flex row: left = 3px accent bar, right = existing card content.
- Bar colour resolved from `state` (`next` → navy, `overdue` → red, `done`/`upcoming` → grey).
- Bar height stretches to match the card (`alignSelf: stretch`), `borderRadius: 22px 0 0 22px` to match the card's existing 22px radius.
- Card's existing border, background, blur and shadow are kept as-is; only the left edge gains the bar.

### Files to edit

- `src/components/instructor/NextUpTile.tsx`
- `src/components/instructor/TodayMiniTimeline.tsx`

### QA at 390px on `/instructor`

- Next Lesson tray shows a thin navy bar along its left edge, full height of the tray.
- Today's Schedule cards each show a left accent bar — navy on the "Next" card, grey on upcoming, red on overdue, muted on done.
- No layout shift or overflow; bars sit flush with the existing rounded corners.
- Spacing between cards and the section header is unchanged.

