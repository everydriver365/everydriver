

# Fix Trip Summary Mobile Layout

## Issues
- Footer buttons are too tall (h-12) taking up excessive screen space
- Content padding and stat cards could be tighter for mobile
- Speed bar labels in RoadSegmentCard use fixed widths that may crowd on small screens

## Changes

### 1. TripSummarySheet.tsx -- Compact footer buttons and tighten spacing
- Reduce footer button height from `h-12` to `h-10`
- Reduce button text size
- Tighten content padding from `p-4` to `px-3 py-4` where needed
- Reduce the large stat text sizes (Duration/Distance) from `text-2xl` to `text-xl`

### 2. RoadSegmentCard.tsx -- Ensure content fits mobile
- Reduce the fixed-width speed label from `w-12` to `w-10` to prevent overflow
- Slightly tighten padding

### 3. SpeedTimeGraph.tsx -- Ensure chart fits within bounds
- Adjust left margin to prevent Y-axis label clipping

