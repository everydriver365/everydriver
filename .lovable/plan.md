## Goal

Every tile/card on the instructor mobile app should sit at the same width — defined by **16px horizontal padding** from the screen edges — so the home, schedule, pupils, settings, etc. all line up.

## Current state

`InstructorPortalLayout` wraps every instructor mobile page in `px-4 py-4` (= 16px)…
**except `/instructor`** (the home), which is rendered edge-to-edge so `MobileHomeRedesign` can manage its own paddings.

Inside `MobileHomeRedesign.tsx` the sections currently use a mix:
- `padding: "0 18px 8px"` (header)
- `padding: "20px 18px 12px"` (hero block)
- `padding: "10px 14px 100px"` (main scroll content)
- A few `padding: "14px 16px …"` inner blocks

Other instructor pages get a clean 16px from the layout, but some add extra horizontal padding inside (`px-3`, `px-5`, `px-6`, or inline `padding: "… 18px"`) that pushes their tiles narrower or wider than the home.

## Plan

### 1. Home page — switch internal section paddings to 16px
File: `src/components/instructor/MobileHomeRedesign.tsx`

Change every top-level section's horizontal padding from `14px`/`18px` to `16px`:
- header row: `0 18px 8px` → `0 16px 8px`
- hero wrapper: `20px 18px 12px` → `20px 16px 12px`
- main scroll container: `10px 14px 100px` → `10px 16px 100px`
- any other top-level section padding using 14/18 horizontally → 16

Inner card paddings (e.g. `14px 16px` inside a tile) stay as-is — those are tile-internal, not tile-width.

### 2. Other instructor mobile pages — remove conflicting outer paddings
Layout already provides 16px. Audit and strip any **outer** wrapper that adds horizontal padding on top of the layout. Candidates to sweep:

```
src/pages/instructor/**/*.tsx
src/components/instructor/**/Page*.tsx
src/components/instructor/settings/**/*.tsx
```

Rules:
- Top-level page wrapper should not set its own `px-3 / px-5 / px-6` or inline horizontal padding. If present, drop it (layout's `px-4` covers it).
- If a page intentionally uses `px-0` to go edge-to-edge (e.g. full-bleed maps), leave it — it's a deliberate exception, not a tile.
- Section headers can keep `px-4` indentation (matches `IOSSectionHeader`'s `px-4`) since 16px = `px-4`.

### 3. Document the rule
Add a one-liner to `mem://style/instructor-portal-design-system`:

> Instructor mobile tiles use 16px side padding (= `px-4`). The portal layout supplies it; pages should not add extra horizontal padding around their tile stack.

### Out of scope
- Tile **internal** padding (the space between a tile's edge and its content) is not changed.
- Border radius, colours, shadows untouched.
- Desktop layout untouched.
- No backend / data changes.

## Files likely touched
- `src/components/instructor/MobileHomeRedesign.tsx` (small numeric edits)
- A handful of pages/components under `src/pages/instructor/` and `src/components/instructor/` where an extra horizontal padding is wrapping the tile stack
- `mem://style/instructor-portal-design-system` (memory note)
