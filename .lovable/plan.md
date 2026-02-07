

# Restyle Quick Action Tiles to Match Reference Design

## What Changes
Restyle the 6 quick action tiles in `HomeQuickActions.tsx` to match the reference image design while keeping the current 3-column grid layout, sizes, and positions.

## Visual Changes
- **Background**: Change from colored backgrounds (e.g. `bg-violet-50`) to plain white (`bg-white`)
- **Border**: Change from colored borders (e.g. `border-violet-200`) to a subtle grey border (`border-gray-200`)
- **Shadow**: Add a soft shadow matching the floating card standard (`shadow-[0_2px_8px_rgba(20,37,66,0.08)]`)
- **Icon**: Wrap each icon in a circular background (light purple/grey circle) instead of showing the icon inline
- **Text**: Keep the label text but make it slightly bolder (`font-semibold`) to match the reference

## File Modified
**src/components/instructor/HomeQuickActions.tsx**
- Update each tile's container: white bg, grey border, soft shadow, rounded-xl
- Add a circular icon container (`w-9 h-9 rounded-full bg-primary/10`) around each icon
- Keep the existing grid layout (`grid grid-cols-3 gap-2`), routes, click handlers, and animation unchanged

## Technical Details
- Replace per-tile `bgColor` and `borderColor` with unified white card styling
- Keep per-tile `iconColor` for the icon itself but use a shared light circle background
- The circular icon container matches the reference: a soft pastel circle behind the icon
