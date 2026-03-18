

## Plan: Tomorrow Tile Redesign Demo Page

Create a demo page at `/demo/tomorrow-tile-designs` showing 5 alternative designs for the Tomorrow/Plan Ahead tile, rendered with mock data in a mobile-width container so you can compare them side by side.

### The 5 Design Options

**Option A — "Boarding Pass"**: Styled like a flight boarding pass with a perforated edge divider, departure/arrival metaphor (first lesson time -> last lesson time), and a tear-off section showing pupil list.

**Option B — "Dark Gradient Card"**: Premium dark slate gradient background (matching iOS design language), white text, with a glowing earnings badge and horizontal scrolling lesson chips.

**Option C — "Timeline Strip"**: Vertical mini-timeline showing each lesson as a node with time, pupil name, and postcode — always expanded, no collapse needed. Compact and scannable.

**Option D — "Split Stat Banner"**: Full-width banner with large hero stat (earnings) on the left, stacked secondary stats (lessons, hours, tasks) on the right, and a swipeable lesson carousel below.

**Option E — "Calendar Card"**: Looks like a torn-off calendar page with the day name/date prominent at the top, lesson count as a large number, and a subtle list underneath. Minimal and clean.

### Implementation

- **1 new file**: `src/pages/demo/DemoTomorrowTileDesigns.tsx` — contains all 5 tile variants rendered with hardcoded mock data (4 lessons, 4h, £140, 1 task) inside a 390px-wide phone frame wrapper.
- **Route**: Add `/demo/tomorrow-tile-designs` to App.tsx with lazy import.
- Each option gets a label badge ("Option A", "Option B", etc.) and short description, following the same pattern as `DemoKenDHeroImages.tsx`.
- Uses framer-motion, lucide icons, and existing Tailwind classes — no new dependencies.

