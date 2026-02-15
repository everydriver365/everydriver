
# Bottom Navigation Demo Page

Create a demo page at `/bottom-nav-demo` showcasing 3 different bottom nav styles side-by-side so you can compare and pick your favourite.

## What You'll See

Each option will be displayed in a phone-frame mockup on the page, with the 6 nav items (Home, Schedule, Track, Money, Pupils, More) and a simulated "Home" active state.

### Option A -- Frosted Glass with Capsule Highlight
- Semi-transparent background with strong backdrop blur (matching the iOS wallet-style cards)
- Active tab gets a rounded capsule background in brand blue (`#0075c9` at 10% opacity)
- No top pill indicator -- the capsule behind icon+label is the active state
- Softer border (`border-border/10`)
- Labels bumped to 12px

### Option B -- Minimal with Dot Indicator
- Clean white/system-grey background, no blur
- Active icon uses brand blue, inactive uses light grey
- Small filled dot under the active icon (no text weight change)
- Ultra-thin hairline top border
- Compact spacing, 12px labels

### Option C -- Filled Active Icon Tile
- System grey background matching `#f2f2f7` (same as the home page tiles)
- Active tab icon sits inside a small rounded-square tile with blue fill and white icon (matching the "More" menu icon style)
- Inactive icons are plain grey outlines
- No top pill, the filled tile IS the indicator
- 12px medium-weight labels

## Technical Details

**New file:** `src/pages/BottomNavDemo.tsx`
- Self-contained demo page with 3 sections, each rendering a static mock of the bottom nav in that style
- Uses the same icon set (Home, CalendarDays, Radio, PoundSterling, Users, Grid3X3) from lucide-react
- Each option shown inside a rounded phone-frame div (max-w-[390px]) with a sample content area above the nav
- No backend changes, no new dependencies

**Modified file:** `src/App.tsx`
- Add import for `BottomNavDemo`
- Add route: `<Route path="/bottom-nav-demo" element={<BottomNavDemo />} />`
