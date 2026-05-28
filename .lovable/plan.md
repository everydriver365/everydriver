## Why nothing changed

The 3D icon auto-upgrade only fires inside `IconTile` and `EmptyState`. The instructor mobile dashboard (`MobileHomeDSM2026`) — which renders Upcoming events, Membership, Tax Digital, Tax estimate, Quick actions, etc. — does **not** use `IconTile`. It defines its own local `IconBox` (line ~501) plus several inline `<Icon size={...} />` blocks, all rendering raw Lucide icons. Same story for `UpcomingEventsCard`, `MTDDeadlineTile`, `TaxEstimateTile`, and `QuickActionTiles`' custom tiles.

So the registry and mapping are correct — they just aren't reached by the surfaces the user is looking at.

## Plan

1. **Upgrade `IconBox` in `MobileHomeDSM2026.tsx`** (the main tile renderer used for Upcoming events / Membership / Tax Digital / quick actions). Use `resolveIcon3D(Icon.displayName)`; when matched, render `<Icon3D size={tile} />` and drop the coloured `bg` square. Otherwise fall back to existing behaviour. Tile sizes already in component (~40–44px) — perfect for 3D.

2. **Sweep the dashboard's stand-alone tiles** to render 3D where a mapping exists:
   - `UpcomingEventsCard.tsx` — calendar tile → 3D calendar
   - `MTDDeadlineTile.tsx` → 3D receipt
   - `TaxEstimateTile.tsx` → 3D coins / bar-chart
   - `MobileHomeRedesign.tsx` IconBox (legacy variant) — same treatment as #1

3. **`QuickActionTiles.tsx`** already uses `IconTile`, so it should be working; verify and only patch if needed.

4. **Leave small inline icons untouched** (chevrons, 14–18px status icons, nav icons inside `<IconBox Icon={NavIcon}/>` at ~18px in the bottom nav — these are too small and should stay flat Lucide).

5. **No new icons generated.** Only registry/mapping wiring. If a tile's Lucide icon has no 3D match, it stays flat — graceful fallback.

## Technical notes

- All edits are presentation-only in `src/components/instructor/`. No business logic touched.
- `IconBox` signature stays the same; only its internals branch on `resolveIcon3D`.
- The coloured `bg` prop is ignored when a 3D asset renders, matching how `IconTile` behaves.
- Risk: `lucide-react` icons expose `displayName` on the forwardRef — already verified by the working `IconTile` auto-resolve path.

After this lands, the tiles visible on `/instructor` (Upcoming events, Membership, Tax Digital, etc.) will switch to 3D claymorphism PNGs; everything without a registered match keeps the current flat Lucide look.