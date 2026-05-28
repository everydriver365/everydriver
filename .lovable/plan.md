## Goal

Replace flat Lucide tile icons with a consistent set of 3D claymorphism PNGs (like the SketchPad / Progress Syllabus / Test Routes / 2D scenarios screenshot) across the instructor mobile app, instructor desktop portal, and pupil portal — wherever tile/menu/empty-state icons appear.

## Approach

1. **Generate a single cohesive 3D icon set** via `imagegen` (transparent PNGs, 512×512) in one consistent style:
   - Soft clay/plasticine material, warm studio lighting top-left, soft contact shadow
   - Muted, friendly palette aligned with our brand (no neon)
   - Slight isometric tilt, ~5–10% padding so they sit nicely inside rounded tiles
   - Saved to `src/assets/icons-3d/<name>.png`
   - Initial batch (~30 icons) covering the most-used concepts. Examples:
     - Schedule: `calendar`, `clock`, `calendar-plus`
     - Pupils: `user`, `users`, `graduation-cap`, `baby`
     - Money: `wallet`, `card`, `coins`, `receipt`, `chart-up`
     - Vehicle: `car`, `fuel`, `route`, `map-pin`
     - Comms: `chat`, `phone`, `bell`, `mail`
     - Teaching: `pencils-cup` (SketchPad), `bar-chart` (Progress), `road` (Routes), `barrier` (Scenarios), `book`, `target`, `trophy`, `medal`, `star`, `shield`
     - Tools/Admin: `settings`, `tools`, `lightbulb`, `sparkles`, `lock`

2. **Build `<Icon3D name="..." size={44} />` component** at `src/components/Icon3D.tsx`:
   - Static `name → import` map (tree-shakeable, no dynamic glob)
   - Falls back to `<Emoji name>` (existing component) if no 3D asset exists for a name yet — guarantees no broken tiles during rollout
   - Optional `tileBg` prop matching the screenshot's neutral card (no coloured tile behind — the icon carries its own visual weight, sits flush like in the reference)

3. **Wire it into the existing icon primitives** so most surfaces upgrade automatically:
   - `src/components/IconTile.tsx` — accept an optional `icon3d?: string`; when present, render the 3D PNG instead of the Lucide icon, drop the coloured background, keep size slot
   - `src/components/instructor/EmptyState.tsx` — same: optional `icon3d` prop
   - Pupil portal `AchievementBadges.tsx` — map `icon_name` ('trophy', 'star', 'medal'...) to 3D set when available
   - Menu list rows (Teaching Aids screen, Tools, Settings landing): swap the leading Lucide icon for `<Icon3D />`

4. **Apply across the apps (incremental, single PR per surface, no behaviour changes)**:
   - Instructor mobile: dashboard tiles, Teaching Aids, Tools, Settings, Pupils list rows, Schedule empty states
   - Instructor desktop portal: same primitives → upgrades automatically where `IconTile`/`EmptyState` are used; spot-check any hardcoded Lucide usages
   - Pupil portal: home tiles, achievements, lesson cards, empty states

5. **Out of scope (keep flat Lucide)**: inline action icons inside buttons, toolbar/header chrome, table column icons, status pills, anything <20px. 3D PNGs only shine at 32px+.

## Technical notes

- Storage: PNGs in `src/assets/icons-3d/` (Vite bundles + hashes them). No CDN, no DB lookups, fully offline.
- File size budget: target <25KB per icon at 512×512 (transparent PNG, optimised). ~30 icons ≈ 750KB total — lazy-import per route to keep initial bundle small if it grows past that.
- Dark mode: PNGs are colour-baked, so they work as-is on light AND dark cards (the soft clay style reads well on both). No tinting needed.
- A11y: `<Icon3D>` renders `<img alt={label} />` with sensible default alt from the name.
- No DB, no edge function, no migration. Pure FE.

## Rollout order

1. Build component + generate first 8 icons (the ones already shown: pencils-cup, bar-chart, road, barrier + calendar, user, wallet, car). Wire into one screen as proof.
2. Generate remaining ~22 icons in a follow-up batch.
3. Sweep instructor mobile → desktop → pupil.

I'll confirm with you after step 1 before generating the full set.