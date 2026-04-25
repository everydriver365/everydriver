## Why these tiles don't change

The Action needed, Next lesson, Schedule (Today's Schedule), and Telematics tiles use **inline `style={{ fontSize: 15, color: "#000000", ... }}`** with hardcoded pixel numbers and hex colors. 

- The `.a11y-scope { font-size: calc(16px * var(--a11y-text-scale)) }` rule only scales things written in `rem`/`em` or that inherit `font-size`. Inline `fontSize: 15` becomes `15px` which ignores the scope.
- The previous refactor only converted `Tile.tsx` and `InstructorTile.tsx` to `em`. `WarmHomeTiles.tsx`, `TelematicsTile.tsx`, `HomeTodaySchedule.tsx`, and `InstructorMobileHome.tsx` were never touched — they hold the real "Action needed / Next lesson / Schedule / Telematics" content.
- High-contrast `[style*="#6E6E73"]` selectors only match exact substring presence and don't cover `IOS.label` constants, dark backgrounds, or the `#000000` text on tiles.

## Fix

### 1. Convert hardcoded pixel font sizes to `em` in the four tile components
For every `style={{ fontSize: N, ... }}` in:
- `src/components/instructor/WarmHomeTiles.tsx`
- `src/components/instructor/TelematicsTile.tsx`
- `src/components/instructor/HomeTodaySchedule.tsx`
- `src/components/instructor/InstructorMobileHome.tsx`

replace `fontSize: 15` → `fontSize: "0.9375em"` (15/16), `14` → `"0.875em"`, `13` → `"0.8125em"`, `12` → `"0.75em"`, `11` → `"0.6875em"`, `10` → `"0.625em"`, `9` → `"0.5625em"`, `17` → `"1.0625em"`, `18` → `"1.125em"`, `20` → `"1.25em"`, `22` → `"1.375em"`. These then scale with the `.a11y-scope` root font-size.

### 2. Add a wrapping `<div className="a11y-scaled">` (or rely on existing `.a11y-scope`)
Confirm `InstructorPortalLayout` and `EveryInstructorLayout` both wrap children in `.a11y-scope`. If `InstructorMobileHome` is rendered outside that scope (e.g. via portal), add `a11y-scope` to its root div.

### 3. Strengthen high-contrast overrides
In `src/index.css`, replace the brittle `[style*="#XXXX"]` rules with broader rules that target the tile primitives directly. Add:
```css
html.a11y-high-contrast .a11y-scope * {
  color: #0a0a0a !important;
}
html.a11y-high-contrast.dark .a11y-scope * {
  color: #ffffff !important;
}
html.a11y-high-contrast .a11y-scope [style*="background"],
html.a11y-high-contrast .a11y-scope .bg-white,
html.a11y-high-contrast .a11y-scope [class*="bg-slate"] {
  background-color: #ffffff !important;
  border: 1.5px solid #0a0a0a !important;
}
```
This forces every tile (regardless of inline color) to high-contrast colors when the toggle is on.

### 4. Verify reduce-motion + large-tap also reach these tiles
Add `data-a11y="tile"` (or use existing classes) to tile root elements and ensure existing motion/tap CSS selectors include them.

### Files changed
- `src/components/instructor/WarmHomeTiles.tsx`
- `src/components/instructor/TelematicsTile.tsx`
- `src/components/instructor/HomeTodaySchedule.tsx`
- `src/components/instructor/InstructorMobileHome.tsx`
- `src/index.css`
