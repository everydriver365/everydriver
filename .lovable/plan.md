## What you'll get

A new **Accessibility** tile in the instructor home Quick Actions grid (between the existing tiles like "Health hub" and "Updates"). Tapping it opens a dedicated **Accessibility** settings page where the user can adjust:

1. **Text size** — 4 presets: Small (90%), Default (100%), Large (115%), Extra Large (130%).
2. **High contrast** — bumps text/border contrast in light & dark modes.
3. **Reduce motion** — disables non-essential animations (Framer Motion + Tailwind transitions).
4. **Larger tap targets** — adds extra padding to interactive elements (≥48px).

Settings persist in `localStorage` and are restored on app load. A live preview at the top of the settings page shows what the changes look like before leaving the screen.

## Why this approach is safe for the UI

The text-size scaling uses a **root font-size multiplier on `<html>`** rather than overriding individual `text-[15px]` style values. Because the entire DSM tile system uses a mix of `rem`-based and pixel-based typography, we will:

- Apply the multiplier as a CSS variable (`--a11y-text-scale`) consumed by a small set of opt-in selectors (`body`, key text utilities), so fixed pixel sizes inside tiles are preserved at the default scale and only "grow" gracefully.
- Cap maximum scale at 130% so 2-column tile grids don't break.
- Use `clamp()` on the body font-size so layouts stay stable on small viewports (440px wide).

## Where things are added

```text
src/components/instructor/HomeQuickActions.tsx     ← add "Accessibility" tile (Accessibility icon, neutral)
src/pages/InstructorAccessibility.tsx              ← new settings page
src/context/AccessibilityContext.tsx               ← provider: read/write settings + apply to <html>
src/index.css                                      ← add --a11y-text-scale rules + .a11y-high-contrast / .a11y-reduce-motion / .a11y-large-tap classes
src/App.tsx                                        ← wrap app in <AccessibilityProvider>
src/routes/instructorAppRoutes.tsx                 ← add /instructor/accessibility route
```

## Tile spec

Follows the existing `WarmTile` pattern (matches Health hub, Updates):

```text
Icon:    Accessibility (lucide-react)
Title:   "Accessibility"
Subtitle:"Text size & contrast"
Category:"neutral"
Route:   "/instructor/accessibility"
```

Inserted just before the "Updates" tile in `HomeQuickActions.tsx` so it sits with the other settings-style entries.

## Settings page layout

Mobile-first, matches the iOS-styled instructor portal (white grouped cards on the cool grey background, indented dividers, uppercase section headers — per the existing `ios-consistency-patterns` memory):

```text
┌─ Accessibility ─────────────────────┐
│  Live preview card                  │
│  "The quick brown fox..." (scaled)  │
├─────────────────────────────────────┤
│  TEXT SIZE                          │
│  [S]  [M ✓]  [L]  [XL]              │ ← segmented control
├─────────────────────────────────────┤
│  DISPLAY                            │
│  ◯ High contrast            [toggle]│
│  ◯ Reduce motion            [toggle]│
│  ◯ Larger tap targets       [toggle]│
├─────────────────────────────────────┤
│  Reset to defaults                  │
└─────────────────────────────────────┘
```

## Technical notes

- **No backend changes** — settings live in `localStorage` under key `dsm:accessibility:v1`.
- **Reduce motion** also sets `html[data-reduce-motion="true"]`, which a small CSS rule targets to disable `transition` and `animation` properties globally (respecting user choice on top of OS-level `prefers-reduced-motion`).
- **High contrast** swaps a handful of `--dsm-*` token values inside a `.a11y-high-contrast` scope so we don't fight the existing theme system.
- The existing `ThemeContext` is untouched; `AccessibilityProvider` is independent and composes cleanly.

## Out of scope

- No changes to the QuickActionsDrawer (slide-out menu) — confirmed home grid only.
- No screen-reader audit or ARIA refactor in this pass — focused on user-controllable visual settings.
