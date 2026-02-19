

# Quick Actions Section Redesign - Design Options

Here are 5 distinct layout concepts for the quick actions area, all keeping the same tiles, icons, colours, badge counts, drag-to-reorder, and routing logic.

---

## Option A: Horizontal Scroll Carousel

A single horizontally scrollable row of compact square tiles (like an iOS app drawer). Each tile is ~64px square with the icon centred and the label below.

- Keeps the "Top Action" banner tile above
- Remaining tiles sit in one horizontal scroll strip with snap points
- Small dot indicators show how many pages of tiles exist
- Pros: saves vertical space, feels native/mobile-first
- Cons: tiles off-screen are less discoverable

## Option B: 3-Column Compact Grid (Phone Home Screen)

Replace the 2-column layout with a tighter 3-column grid -- each cell is a rounded square icon with a small label underneath (like an iPhone home screen).

- Remove the full-width "Top Action" hero -- treat all tiles equally in the grid
- 3 tiles per row, ~56px icons, label below in 10px text
- Badge counts sit as red dots on the icon corner
- Pros: more tiles visible without scrolling, familiar pattern
- Cons: labels may truncate on narrow screens

## Option C: Segmented Tabs with Categories

Group tiles into 2-3 tab categories (e.g. "Core", "Money", "Tools") using a pill-style tab bar above the grid.

- Each tab shows a 2x2 or 2x3 grid of relevant tiles
- Active tab is highlighted with primary colour
- Keeps the current tile styling (icon + label side by side)
- Pros: reduces visual overload, logical grouping
- Cons: extra tap to switch categories

## Option D: Collapsible Accordion Sections

Split tiles into named sections ("Teaching", "Finance", "Vehicle") that can expand/collapse.

- Each section header is a slim bar with section name and chevron
- Tiles inside each section use the existing 2-column layout
- First section auto-expanded, rest collapsed
- Pros: clean, scannable, user controls density
- Cons: more taps to reach tiles in collapsed sections

## Option E: Floating Action Chips (Scrollable Pill Bar)

A horizontally scrollable row of pill-shaped chips (icon + label inline), like quick-filter chips in Google Maps.

- Each pill is ~120px wide, rounded-full, with icon on left and label on right
- Badges appear as small red dots on the pill
- No full-width hero tile -- all tiles are equal
- Pros: modern, touch-friendly, very compact
- Cons: limited to single row, requires scrolling for all tiles

---

## Technical Details

All options will:
- Retain the existing `QuickActionTiles` component structure
- Keep drag-to-reorder (edit mode) functionality intact
- Preserve custom icon images, badge counts, and swipe actions
- Use the same `useInstructorTilePreferences` hook for ordering/visibility
- Maintain square corners (`rounded-none`) per the portal visual identity
- Work within the existing framer-motion animation system

Implementation involves modifying only `src/components/instructor/QuickActionTiles.tsx` -- no database or routing changes needed.

