## Goal

Strip the remaining blue accent colour from the "Up next" card in the instructor mobile home (`NextUpTile.tsx`) so the card reads as fully neutral, matching the already-greyed "Up next" label.

## What still has blue today

After the previous edit, the label is grey but three blue elements remain on the card:

1. The **Navigation icon** in the map's "open in maps" button — currently `#2B7BC8` (blue).
2. The **origin pin** in the route list (the "Your location" row) — uses a blue ring + blue inner dot (`#2B7BC8`).
3. None on the destination pin (it's intentionally red `#C8434F` to indicate the pupil pickup) — leave as-is since it's a semantic destination marker, not an accent.

## Changes

File: `src/components/instructor/NextUpTile.tsx`

1. **Line 399** — change the Navigation icon colour from `#2B7BC8` to neutral `#6E6E73` (same grey as secondary text).
2. **Lines 409–414** — change the origin pin's border + inner dot from `#2B7BC8` to neutral `#6E6E73`, so "Your location" is a simple grey marker.

Leave the destination (red) pin untouched — it's a functional marker for the pickup, not decorative accent.

## Out of scope

- Header label (already neutral).
- Destination pin colour (semantic, not an accent).
- Other home tiles / other home views (`CleanHomeView`, `BestMateHomeView`, `IOSNativeHomeView`, etc.) — only the active `NextUpTile` used by `InstructorMobileHome`.

## Verification

After applying, the "Up next" card should contain no blue: label grey, time/name black, origin pin grey, destination pin red, map icon grey.
