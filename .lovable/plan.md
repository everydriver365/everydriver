Remove the "primary" solid-fill treatment from the first Quick Access tile so every tile uses its tone tint consistently.

In `src/components/instructor/MobileHomeBottomSections.tsx` (around line 796):

- Drop the `isPrimary = pageIdx === 0 && idx === 0` flag.
- Always render the tile background as `#FFF` with the standard `0.5px solid ${BORDER}` outline.
- Always use `tonePair.bg` for the icon chip background and `tonePair.fg` for the icon colour.
- Keep title text colour the standard dark text (no white-on-blue branch).
- Leave layout, sizing, padding, badges, ordering, routes, and handlers exactly as they are.

Result: Settings (and whichever tile happens to land in slot 0) renders with the same pale blue tint chip as the other blue tiles instead of the dark `#3D55A1` solid fill.