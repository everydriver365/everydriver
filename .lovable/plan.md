
The user reports that in dark mode, some tiles still appear light. Looking at `ActivityTilesGrid.tsx`, the empty-state "All clear" card uses hardcoded colors (`#FFFFFF` bg, `#D3D1C7` border, `#2C2C2A` text) instead of DSM theme tokens. Same issue likely in other tile components.

Let me check what's hardcoded.

## The Problem

Several tile/card components still use hardcoded hex colors instead of the `--dsm-*` theme tokens, so they don't react to dark mode:

1. **`ActivityTilesGrid.tsx`** — "All clear" empty state card uses `#FFFFFF`, `#D3D1C7`, `#2C2C2A` hardcoded.
2. **`InsightTilesGrid.tsx`** — tiles render fine via `WarmTile` but icons have no `iconColor`, falling back to category stroke colors which may not contrast well on dark navy.
3. **Other instructor tiles** likely affected: `TelematicsTile`, any custom cards on Schedule / Pupils / Money / Menu pages still using `#F7F5F0`, `#FFFFFF`, `#2C2C2A`, `#D3D1C7` literals.

## The Fix

**Sweep all hardcoded warm-paper colors → DSM tokens** inside the instructor portal:

| Hardcoded | Replace with |
|---|---|
| `#FFFFFF` (card bg) | `hsl(var(--dsm-card))` |
| `#F7F5F0` (page bg) | `hsl(var(--dsm-bg))` |
| `#D3D1C7` (border) | `hsl(var(--dsm-border))` |
| `#2C2C2A` (primary text) | `hsl(var(--dsm-text))` |
| `#888780` / `#5F5E5A` (secondary text) | `hsl(var(--dsm-text-secondary))` |
| `#A32D2D` (red) | `hsl(var(--dsm-accent-red))` |

### Files to update
1. `src/components/instructor/ActivityTilesGrid.tsx` — "All clear" empty card.
2. `src/components/instructor/TelematicsTile.tsx` — verify card surface uses tokens.
3. `src/components/instructor/InsightTilesGrid.tsx` — add `iconBg` + `iconColor` so icons have proper contrast in both modes (matching the filled SF-style used in `ActivityTilesGrid`).
4. Audit `src/pages/instructor/**` and `src/components/instructor/**` for any remaining hardcoded `#FFFFFF` / `#F7F5F0` / `#D3D1C7` / `#2C2C2A` and replace with tokens.
5. Audit page-level wrappers (Schedule, Pupils, Money, Menu, Settings) — replace `background: "#F7F5F0"` with `hsl(var(--dsm-bg))`.

### Out of scope
- Logic, routing, data, layout, and category stroke palette stay unchanged.
- Marketing / pupil / school portals untouched (instructor-only per prior scope).

### Verification
After the sweep, toggle the sun/moon on Home, Schedule, Pupils, Money, Menu, Telematics, Insights — every surface should flip to navy `#162035` cards on `#0F1B2D` background with no white islands.
