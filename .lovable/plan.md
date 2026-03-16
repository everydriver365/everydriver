

# Add Find Nearby Tile to Home Quick Actions

## What
Add the "Find Nearby" tile to the `HomeQuickActions` component so it appears in the quick actions grid on the instructor home page.

## Implementation
- Add a new entry to the `actions` array in `HomeQuickActions.tsx` with:
  - id: "find-nearby"
  - label: "Find Nearby"
  - subtitle: "Toilets, food & more"
  - icon: `MapPin` (already imported)
  - iconColor: "text-sky-600"
  - route: "/instructor/find-nearby"

### File to Edit
- `src/components/instructor/HomeQuickActions.tsx`

