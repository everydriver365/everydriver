## Why accessibility is patchy across the instructor app

The settings only "land" in some places because the styles are scoped to a `.a11y-scope` class that has to be present on whatever wrapper a route happens to use. The instructor app has several wrappers (`InstructorPortalLayout`, `EveryInstructorLayout`, standalone pages, modals/sheets that render in React portals at the body root), and most of them never get the class — so the CSS variables, contrast classes and tap-target rules silently do nothing there. On top of that, many tiles use hardcoded inline `fontSize: 15` / hex colors that bypass the variables entirely.

## The solution: promote accessibility from "scoped" to "global"

Stop relying on a class wrapper. Apply the accessibility state on `<html>` itself (it already is — we just don't read it there in CSS) and rewrite the rules to target the document root. That way every route, every layout, every portal, and every modal inherits the same behaviour automatically — no per-layout wiring required.

### What changes

1. **CSS rules move from `.a11y-scope` → `html` / `:root`**
   - Text scaling driven by `--a11y-text-scale` on `:root` using `font-size: calc(16px * var(--a11y-text-scale))` on `html`, so `rem` units across the entire app scale.
   - Keep the `zoom` fallback behind `html.a11y-text-zoom` (opt-in) only — `rem` scaling is the primary mechanism so it doesn't double-scale or break fixed layouts.
   - High contrast: `html.a11y-high-contrast` selectors override `--foreground`, `--background`, `--border`, `--muted-foreground` tokens at the `:root` level. Because every shadcn component reads these tokens, contrast then applies everywhere — including portalled dialogs, sheets, dropdowns and toasts.
   - Reduce motion: `html.a11y-reduce-motion *` disables transitions/animations globally (already partly there — make it authoritative).
   - Large tap targets: `html.a11y-large-tap` bumps min-height on buttons, links and inputs globally.

2. **Remove `.a11y-scope` requirement**
   - Drop the class from `EveryInstructorLayout`, `InstructorPortalLayout`, `InstructorAccessibility` page wrapper. Keep the class as a no-op alias for safety so nothing breaks.

3. **Kill the inline-style bypass on the four problem tiles**
   Convert hardcoded pixel and hex values to token/rem equivalents in:
   - `src/components/instructor/WarmHomeTiles.tsx` (Action Needed)
   - `src/components/instructor/NextUpTile.tsx` (Next Lesson)
   - `src/components/instructor/HomeTodaySchedule.tsx` (Schedule)
   - `src/components/instructor/TelematicsTile.tsx` (Telematics)
   - `src/components/instructor/InstructorMobileHome.tsx` (container text)
   
   Replace `style={{ fontSize: 15 }}` with Tailwind classes (`text-sm`, `text-base`) and replace hex colors with semantic tokens (`text-foreground`, `text-muted-foreground`, `border-border`). These already respond to high-contrast overrides at the root.

4. **Verify the four toggles end-to-end**
   - Text size: change SM → XL on the Accessibility page and confirm Action Needed, Next Lesson, Schedule, Telematics, top nav, sheets and modals all resize.
   - High contrast: confirm card backgrounds, body text, borders, and *portalled* dialogs all flip.
   - Reduce motion: confirm Framer Motion entrance animations on home tiles stop.
   - Large tap targets: confirm bottom-nav icons and primary buttons grow.

### Why this fixes the "disjointed" feeling

Today the settings are essentially opt-in per layout. After this change they're applied at the document root, so:
- No layout can "forget" to opt in.
- Portalled UI (Radix dialogs, sheets, dropdowns, toasts) inherits automatically because portals attach to `document.body`, which lives inside `<html>`.
- Newly-added pages and components get accessibility for free as long as they use design tokens (`text-foreground`, `bg-card`, etc.) and `rem`-based sizes — which is the project convention already.

### Files touched

- `src/index.css` — relocate `.a11y-scope` rules to `html` / `:root` selectors; keep `.a11y-scope` as alias.
- `src/context/AccessibilityContext.tsx` — comment update only; logic already targets `<html>`.
- `src/components/layout/EveryInstructorLayout.tsx` — remove now-redundant `a11y-scope` class.
- `src/components/layout/InstructorPortalLayout.tsx` — same.
- `src/components/instructor/WarmHomeTiles.tsx`
- `src/components/instructor/NextUpTile.tsx`
- `src/components/instructor/HomeTodaySchedule.tsx`
- `src/components/instructor/TelematicsTile.tsx`
- `src/components/instructor/InstructorMobileHome.tsx`

No database, no auth, no edge function changes.
