

# Add Find Nearby Tile to AppStyleHomeView

## Problem
The "Find Nearby" tile is missing from the `additionalTiles` array in `src/components/instructor/AppStyleHomeView.tsx`, which is the component that renders the mobile app-style icon grid on the instructor home page.

## Fix
Add a `find-nearby` entry to the `additionalTiles` array in `AppStyleHomeView.tsx`:

```typescript
{ id: "find-nearby", title: "Find Nearby", icon: "MapPin", route: "/instructor/find-nearby", display_order: 114.5 },
```

This goes after the `automations` entry (line 80). The `MapPin` icon is already in `iconMap`.

### File to edit
- `src/components/instructor/AppStyleHomeView.tsx` — add one line to `additionalTiles`

