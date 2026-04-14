

## Plan: Replace Activity Tile PNG Icons with Filled Gradient Lucide Icons

### What Changes
Replace the four PNG image icons in the activity tiles with Lucide React icons on gradient circle backgrounds, matching the "Filled Gradient" style you selected.

### Icon Mapping
| Tile | Current | New Lucide Icon | Gradient |
|------|---------|----------------|----------|
| Job Offers | `job-offers-icon.png` | `Briefcase` | purple `#AF52DE → #8B3FBF` |
| Messages | `messages-icon.png` | `MessageSquare` | orange `#FF9500 → #E08600` |
| Tests | `test-requests-icon.png` | `FileText` | cyan `#5AC8FA → #4AB0E0` |
| Fill Gaps | `fill-gaps-icon.png` | `CalendarPlus` | pink `#FF2D55 → #E0264B` |

### File to Modify
**`src/components/instructor/ActivityTilesGrid.tsx`**
- Remove PNG image imports (`job-offers-icon.png`, `messages-icon.png`, `test-requests-icon.png`, `fill-gaps-icon.png`)
- Import Lucide icons: `Briefcase`, `MessageSquare`, `FileText`, `CalendarPlus`
- Replace each tile's `icon` from `<img>` to a gradient circle with white Lucide icon inside
- Add a `gradient` property to each tile definition for the background style
- Icon container: `w-9 h-9 rounded-full` with `background: linear-gradient(135deg, color1, color2)`, icon rendered white at `size={18}` `strokeWidth={2}`

