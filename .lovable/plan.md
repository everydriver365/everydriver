

# Make Driving Report Mobile-Friendly

## Problems Identified

1. **SheetContent too narrow on mobile**: The driving report opens in a `SheetContent side="right"` with `sm:max-w-2xl`, which on mobile takes only part of the screen width.
2. **5-column stats grid doesn't fit**: `grid-cols-2 md:grid-cols-5` means 2 columns on mobile with the 5th stat orphaned on its own row.
3. **Session list + map side-by-side on mobile**: `grid lg:grid-cols-3` falls back to single column, but the `ScrollArea h-[400px]` wastes vertical space on small screens.
4. **Map height fixed at 250px**: Too tall relative to mobile viewport, pushing content below the fold.
5. **Event rows have too many inline elements**: Badge + speed + time all on one line causes overflow on narrow screens.
6. **Header title and Export button cramped**: `flex items-center justify-between` with long pupil names causes wrapping issues.

## Changes

### 1. SheetContent (InstructorPupils.tsx)
- Change to `className="w-full sm:max-w-2xl overflow-y-auto"` so it takes full width on mobile.

### 2. PupilDrivingReport.tsx -- Summary Stats
- Change grid from `grid-cols-2 md:grid-cols-5` to `grid-cols-3 sm:grid-cols-5` so the 5 stats wrap more naturally (3+2 on small screens, 5 on larger).
- Reduce font size on mobile: `text-xl sm:text-2xl` for stat values.

### 3. PupilDrivingReport.tsx -- Header
- Stack the title and Export button vertically on mobile using `flex flex-col sm:flex-row`.
- Truncate long pupil names.

### 4. PupilDrivingReport.tsx -- Sessions Tab
- Reduce `ScrollArea` height on mobile: `h-[250px] lg:h-[400px]`.
- Reduce map height on mobile: pass `height` as `"180px"` on small screens (or use a responsive class).

### 5. PupilDrivingReport.tsx -- Event Rows
- Wrap badge and speed/time onto a second line on mobile using `flex-wrap` and responsive layout.
- Ensure text truncation on notes.

### 6. PupilDrivingReport.tsx -- Tabs
- Make the TabsList horizontally scrollable on mobile if text overflows, similar to the fleet dashboard pattern (`overflow-x-auto`).

### 7. GeneratedDrivingReport.tsx
- Score display: reduce SVG size on mobile (`w-16 h-16 sm:w-20 sm:h-20`).
- Stats grid already uses `grid-cols-3` which is fine.
- No major issues here -- this component is already fairly mobile-friendly.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/InstructorPupils.tsx` | Full-width sheet on mobile |
| `src/components/instructor/PupilDrivingReport.tsx` | Responsive stats grid, smaller map, shorter scroll area, stacked header, scrollable tabs, wrapped event rows |
| `src/components/instructor/GeneratedDrivingReport.tsx` | Minor: smaller score circle on mobile |

