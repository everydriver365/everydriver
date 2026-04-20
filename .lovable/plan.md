
Replace `/accessible/trackers` page entirely with the Open Road tracker design. Scoped so it doesn't affect the rest of the accessible site.

## Plan

### 1. Rewrite `src/pages/accessible/AccessibleTrackers.tsx`
Drop the existing DB-driven product grid. Build a static marketing page with the 6 sections from the brief:
1. Hero (teal tint card, badge, h1, subtitle, two CTAs)
2. Phone app vs Open Road tracker comparison (2 cards, recommended border on right)
3. "What it measures" — 5 metric tiles (Speed/Accel/Braking/Cornering/Route)
4. "What members use it for" — purple tint, 4 use-case rows
5. Privacy & consent strip
6. Final CTA

Keep `AccessibleLayout` wrapper so header/footer/a11y toolbar remain.

### 2. Scoped styles
Wrap the whole page in a `<div className="open-road-tracker">`. Add a small style block at the top of `index.css` (or inline `<style>` in the component) scoped under `.open-road-tracker` to apply:
- Inter font, 400/500 only
- 15px body, 1.6 line-height
- Sentence case (no transforms needed, just authored copy)
- Teal/purple/blue/amber/coral/pink/grey palette as CSS variables
- 8px / 12px / 100px corner radii
- 0.5px borders, no shadows, no gradients
- 40px min tap targets

This guarantees zero leakage into the rest of the accessible site.

### 3. Icons
Use lucide-react: `Clock`, `ArrowRight`, `ArrowLeft`, `RotateCw`, `MapPin` (metrics); `Shield`, `FileText`, `Users`, `Info` (use-cases); `Check`, `X`, `Info` (lists/privacy).

### 4. CTAs
"Request a tracker" buttons → for now link to `/accessible/forum` (placeholder) or scroll to a contact anchor. Will confirm route later if needed — using `mailto:` or anchor is safest until a request flow exists.

### Files
**Edited**
- `src/pages/accessible/AccessibleTrackers.tsx` — full rewrite

**Not touched**
- Layout, header, footer, other accessible pages, DB tables (the `accessible_trackers` table stays — just unused on this page)

### Out of scope
- Nav link rename to `/tracker` (route stays `/accessible/trackers`)
- Removing the `accessible_trackers` DB table
- Building the actual "Request a tracker" form

### Verification
- Visit `/accessible/trackers` → new Open Road design renders
- Other accessible pages unchanged (Inter/teal styling does not bleed)
- Mobile (≤620px): comparison cards stack, metric tiles wrap to 2–3 per row
- Keyboard tab order works, focus rings visible
