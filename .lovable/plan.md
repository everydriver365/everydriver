
# Redesign Quick Actions as 3-Column "Quick Access" Grid

## Overview
Replace the current 2-column horizontal tile layout in `QuickActionTiles.tsx` with a clean 3-column grid matching the reference image. Each tile will show a centered icon above the label and a short subtitle, with soft pastel-coloured icon backgrounds and `rounded-2xl` card styling.

## What Changes

### Visual Layout
- Switch from `grid-cols-2` horizontal row tiles to `grid-cols-3` vertical card tiles
- Each tile becomes a vertically-stacked card: icon circle at top, bold title below, muted subtitle underneath
- All tiles get the same dimensions and `rounded-2xl` corners with a subtle shadow
- Icon containers become larger circles (`w-12 h-12`) with soft pastel backgrounds matching the reference colours
- The "Schedule" tile no longer spans full width -- all tiles are equal size

### Section Header
- Rename the section from "Quick Actions" to "Quick Access" in `InstructorMobileHome.tsx`

### Tile Definitions
The 12 tiles from the reference image will be mapped to existing routes and icons:

| Tile | Icon | Subtitle | Route |
|------|------|----------|-------|
| Pupils | Users | count | /instructor/pupils |
| Schedule | Calendar | X today | /instructor/schedule |
| Live Map | MapPin | Track | /instructor/tracking |
| Payments | CreditCard | due amount | /instructor/payments |
| Tests | Award | X upcoming | /instructor/test-results |
| Settings | Settings | Admin | /instructor/settings |
| Track Lesson | BookOpen | Log | /instructor/track-lesson |
| Take Payment | PoundSterling | Collect | /instructor/take-payment |
| Sat Nav | Navigation | Navigate | /instructor/satnav |
| Availability | Clock | Manage | /instructor/availability |
| Walk Back | Footprints | Route | /instructor/walk-back |
| Vehicle Health | Wrench | Check | /instructor/vehicle-health |

### Colour Scheme (per tile, cycling)
Each tile icon gets a distinct soft pastel background matching the reference:
- Pupils: blue, Schedule: amber, Live Map: emerald
- Payments: blue, Tests: amber, Settings: slate
- Track Lesson: blue, Take Payment: amber, Sat Nav: blue
- Availability: amber, Walk Back: rose, Vehicle Health: rose

## Technical Details

### Files Modified

**`src/components/instructor/QuickActionTiles.tsx`** (normal view mode, lines 436-491)
- Change grid from `grid-cols-2` to `grid-cols-3`
- Remove the `col-span-2` schedule special case
- Restructure each tile from horizontal (icon left, text right) to vertical (icon top, text below, centered)
- Increase icon container from `w-8 h-8` to `w-12 h-12 rounded-2xl`
- Center-align title and subtitle text
- Keep all existing functionality: badges, edit mode, swipe actions, custom icon images

**`src/components/instructor/InstructorMobileHome.tsx`** (line 712)
- Change section label from "Quick Actions" to "Quick Access"

### Preserved Functionality
- Edit mode (drag-and-drop reorder, hide/show tiles) remains unchanged
- Badge counts (messages, jobs) still display
- Custom icon images (PNG assets) still render when available
- Tile preferences (ordering, hiding) still work
- Loading skeleton updates to 3-column grid
