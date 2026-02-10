

# Show Both Nearest and Cheapest Fuel on the Dashboard Card

## Overview
Redesign the `FuelFinderCard` component to display both the cheapest and nearest fuel stations side-by-side, instead of toggling between them with buttons.

## Current Behavior
- A toggle switches between "Cheapest" and "Nearest" modes
- Only one station is shown at a time

## New Design
Two compact rows stacked vertically inside the card, each showing one station:

**Row 1 -- Cheapest:** Green accent, shows price prominently, station name, and distance  
**Row 2 -- Nearest:** Blue accent, shows distance prominently, station name, and price  

Each row has its own "Go" navigate button. The header toggle buttons are removed entirely.

## Layout

```text
+------------------------------------------+
| [Fuel icon] Fuel Finder          [>]     |
+------------------------------------------+
| [Green] Cheapest                         |
| [Brand] 142.9p E10  StationName  [Go]   |
|         2.3 miles away                   |
+------------------------------------------+
| [Blue]  Nearest                          |
| [Brand] 0.8 mi      StationName  [Go]   |
|         145.2p E10                       |
+------------------------------------------+
```

If cheapest and nearest are the same station, show a single row with both badges.

## Technical Changes

### File: `src/components/instructor/FuelFinderCard.tsx`
- Remove the `mode` state and toggle buttons
- Render both `cheapest` and `nearest` stations in separate styled rows
- Green-tinted row for cheapest (price-first layout)
- Blue-tinted row for nearest (distance-first layout)
- Each row gets its own brand badge and "Go" button
- If `cheapest` and `nearest` are the same station (same lat/lng), show a single combined row with both "Cheapest" and "Nearest" badges
- Keep the card clickable to navigate to `/instructor/fuel`
- Keep loading and error states as-is
