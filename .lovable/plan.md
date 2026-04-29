## Make instructor tiles pop

The current `InstructorTile` is intentionally flat (white card, 0.5px #E5E5EA border, `boxShadow: none`) on a near-white `#F4F7F6` background — that's why everything blends. Here are 4 levers, ranked by impact. We can apply 1, 2, or all of them.

### Option A — Add lift via layered shadow (smallest change, biggest payoff)
Replace `boxShadow: "none"` on `InstructorTile` with a soft 2-layer shadow (matches the existing `shadow-lift` token already used elsewhere in the app):
```
boxShadow: "0 1px 2px rgba(20,30,60,0.04), 0 8px 20px rgba(20,30,60,0.08)"
```
Drop the hairline border (or fade it to `#EEF0F4`) so the shadow does the separation work instead of the line. Result: tiles float off the page like the `BestMateTile` / `Card` components already do.

### Option B — Warm up the background canvas
The `#F4F7F6` page bg is too close to white. Two choices for the dashboard wrapper:
1. Subtle vertical gradient `linear-gradient(180deg, #EEF2F7 0%, #E6ECF3 100%)` — cool slate, matches DSM brand.
2. Flat `#EEF1F5` (already the DSM light theme surface token).

Either gives white tiles real contrast without touching tile code.

### Option C — Tinted icon block becomes the full top edge
Currently the coloured tint sits in a 40×40 rounded square. Instead, paint a **soft category-tinted top stripe** (or a 4px coloured top border) so each tile carries its category colour even at a glance. Keeps the white body but adds personality. Example for the "money" tile: 3px top border `#B8801F`, or a top-left radial wash from `colors.tint` fading to white.

### Option D — Press + hover micro-depth
Add `:hover` shadow boost and keep the existing `:active scale(0.97)`:
```
.instructor-tile:hover { box-shadow: 0 2px 4px rgba(20,30,60,0.06), 0 14px 28px rgba(20,30,60,0.12); transform: translateY(-1px); }
```
Makes the grid feel alive when scrolled past.

### Recommendation
Ship **A + B + D** together — that's the standard "iOS widget" recipe and is fully consistent with your `BestMateTile` and `Card` aesthetic already in the codebase. Skip C unless you want the tiles to read as more colourful/playful (it's a brand shift).

### Files touched
- `src/components/instructor/InstructorTile.tsx` — shadow, border, hover styles in the inline `<style>` block (lines 95–98 + 230–239).
- `src/pages/InstructorPortal.tsx` (or whichever wrapper sets the `#F4F7F6` bg) — swap to `#EEF1F5` or the gradient.

No schema, no new components, no memory changes. ~15 lines edited total.

Reply with **A+B+D** (recommended), or pick any combination, and I'll implement.
