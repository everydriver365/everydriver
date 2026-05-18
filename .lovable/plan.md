## Problem

`/instructor/settings` renders two stacked left rails — the main dashboard sidebar AND a second 260px Settings sidebar inside `SettingsShellV3`. At 932px viewport this leaves a cramped right pane and feels noisy/messy.

## Fix — single-pane Settings, no inner sidebar

Rework `src/components/instructor/settings/v3/SettingsShellV3.tsx` only. No route, no `areas.tsx`, no dashboard sidebar changes.

**Landing (`/instructor/settings`)**
- Remove the `<aside>`. Single centered column (max ~960px), generous padding.
- Header: "Settings" title + one-line subtitle + a single search input below.
- Body: each of the 6 area groups rendered as a section:
  - Small uppercase group label (You, Teaching, Bookings & Money, etc.)
  - Responsive card grid (1 col mobile, 2 cols ≥640px, 3 cols ≥1024px) of item cards: colored icon tile, label, one-line description, chevron. Click → `/instructor/settings/:itemId`.
- Search filters cards live across all groups. Empty groups hidden. If exactly one card matches and user presses Enter, navigate to it.

**Detail (`/instructor/settings/:itemId`)**
- Also no inner sidebar — same single centered column.
- Top row: "← All settings" link (navigates back to `/instructor/settings`).
- Keep existing breadcrumb (Dashboard › Settings › Group › Item).
- Keep existing hero summary card + section cards (`ItemDetail` unchanged internally).

**Routing tweak**
- `categoryId` undefined → render `<SettingsLanding />`.
- `categoryId` present → resolve via `ALL_ITEM_IDS` / `LEGACY_ID_MAP` and render `<ItemDetail />`. Drop the current "default to profile" fallback so the landing page actually shows when no item is selected.

**Preserved**
- `SettingsDirtyProvider` + `SettingsSaveBar` wrap both modes.
- All existing item content, icons, descriptions, hero renderers, sections.
- Mobile flow (`SettingsLayout` in `InstructorSettingsHub`) untouched per project rule.

## Out of scope
- Renaming groups/items, removing settings, restructuring `areas.tsx`.
- Any mobile layout change.
- Dashboard sidebar (already flattened to a single Settings link).

## Files

- `src/components/instructor/settings/v3/SettingsShellV3.tsx` — remove `<aside>`, add `SettingsLanding` subcomponent, branch on `categoryId`, add back link in detail mode.
