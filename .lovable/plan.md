
## Goal
Remove the road-sign background image from the instructor mobile app and make the safe-area inset and the header bar share a single, consistent colour (matching the underlying app background).

## Changes

**1. `src/index.css` — `.instructor-shell-bg`**
- Remove `background-image`, `background-repeat`, `background-size`, `background-attachment`.
- Keep `background-color: var(--instructor-bg-start)` and `min-height: 100dvh`.
- Set `--instructor-bg-start` to `#FFFFFF` (white) so the whole instructor shell, safe area, and header read as one continuous surface. (`--instructor-bg-overlay` updated to `rgba(255,255,255,0.85)` to keep frosted page headers consistent.)

**2. `src/components/instructor/InstructorMobileHeader.tsx`**
- Change the safe-area fill `<div className="bg-[#f2f2f7] pt-[env(safe-area-inset-top)]" />` to `bg-white` so it matches the header tile (which is already `bg-white`).
- Result: safe area + header + page background are all the same white surface; the bottom hairline border (`border-b border-black/[0.06]`) still visually separates the header from content.

## Out of scope
- Tiles, cards, and bottom nav stay as-is (they already render on a light surface).
- The earlier "transparent" overrides on Home / Schedule / Track pages remain harmless — they'll simply show the new white shell behind them.

## Result
A clean, uniform white top section (status bar safe area → header → page) with no pattern image, matching the rest of the app surface.
