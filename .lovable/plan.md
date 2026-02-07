

## Replace All Quick Action Icons with iOS-Style Icons

Currently, only 3 tiles (Schedule, Messages, Settings) have custom iOS-style SVG icons. The remaining tiles use generic Lucide line icons which look out of place. This plan creates custom iOS-style SVG icon components for every tile type and refactors the rendering logic.

### Icons to Create

Each icon will be a 120x120 SVG with a rounded-rect background, gradient fill, and white glyph -- matching the existing CalendarIcon, MessagesIcon, and SettingsIcon pattern.

| Tile | Icon Name | Background Gradient | Glyph |
|------|-----------|-------------------|-------|
| Pupils | PupilsIcon | Blue (#007AFF to #0055D4) | Two person silhouettes |
| Job Offers | JobOffersIcon | Purple (#AF52DE to #8B3FC1) | Briefcase |
| Payments | PaymentsIcon | Green (#34C759 to #248A3D) | Credit card / pound sign |
| Availability | AvailabilityIcon | Orange (#FF9500 to #CC7700) | Clock face |
| Vehicle Health / Find Fuel | CarIcon | Cyan (#32ADE6 to #1A8FC4) | Car silhouette |
| Expenses | ExpensesIcon | Pink (#FF2D55 to #D4234A) | Receipt |
| Find My Car | FindCarIcon | Red (#FF3B30 to #CC2F26) | Navigation pin |
| Log Test Result / CPD Log | AwardIcon | Teal (#30B0C7 to #1F8A9E) | Trophy / ribbon |
| Locations | LocationsIcon | Coral (#FF6B6B to #E04545) | Map pin |
| Health Hub | HealthIcon | Rose (#FF2D55 to #E0245E) | Heart |
| To Do | TodoIcon | Indigo (#5856D6 to #4240A8) | Checklist |

### Architecture Change

Instead of the current chain of `if/else` checks for each special icon, refactor to use a **single icon mapping** approach:

1. Create an `iosIconMap` that maps action identifiers (route or title) to the corresponding iOS icon component
2. The tile renderer checks this map first; if found, render the iOS icon; otherwise fall back to the Lucide icon in a colored square (for any future/unknown tiles)

This eliminates the growing `isScheduleAction` / `isMessagesAction` / `isSettingsAction` pattern and makes adding new icons trivial.

### Technical Details

**New files (11 icon components):**
- `src/components/icons/PupilsIcon.tsx`
- `src/components/icons/JobOffersIcon.tsx`
- `src/components/icons/PaymentsIcon.tsx`
- `src/components/icons/AvailabilityIcon.tsx`
- `src/components/icons/CarIcon.tsx`
- `src/components/icons/ExpensesIcon.tsx`
- `src/components/icons/FindCarIcon.tsx`
- `src/components/icons/AwardIcon.tsx`
- `src/components/icons/LocationsIcon.tsx`
- `src/components/icons/HealthIcon.tsx`
- `src/components/icons/TodoIcon.tsx`

**Modified file:**
- `src/components/instructor/QuickActionTiles.tsx`
  - Add an `iosIconMap` keyed by route path, mapping to the SVG component
  - Replace the if/else chain in the normal view grid with a single lookup
  - Keep fallback rendering for unmapped icons
  - Update edit mode to also show iOS icons in the drag list

Each SVG component follows the same structure as the existing icons:
```text
+---------------------------+
| 120x120 rounded rect      |
| with linear gradient bg    |
|                            |
|    White glyph shape       |
|    centered                |
|                            |
+---------------------------+
```

All icons accept a `className` prop for sizing, matching the existing pattern.
