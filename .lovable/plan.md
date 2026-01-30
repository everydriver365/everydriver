
# Route Summary Display After Track Completion

## Overview
Create an enhanced post-route summary screen inspired by the fitness app workout summary UI. This will display an interactive map with the route, key statistics (duration, distance), and a detailed breakdown of roads travelled with speeds and speed limits shown in graphical format.

## Current State Analysis
- **Tracking ends** in `InstructorTraccarSession.tsx` via `stopSession()` function
- After stopping, a `Sheet` opens with `SessionRouteReport` component
- `SessionRouteReport` calls the `generate-route-report` edge function to get:
  - Route GPS points with lat/lon/speed
  - Road segments with names, speed limits, avg/max speeds, compliance status
  - Overall stats (distance, duration, avg speed, max speed)
  - Driving behavior events

The existing `SessionRouteReport` already shows some of this data but lacks:
1. A visual speed graph over time (like the reference image)
2. A larger, more prominent route map
3. Better visual hierarchy matching the workout summary aesthetic

## Design Inspiration (from reference image)
- **Dark themed modal** with prominent map at top
- **Duration and distance** displayed prominently below the map
- **Time-segmented graphs** showing metrics over the journey
- **Clean stat cards** for key metrics

## Implementation Plan

### 1. Fix Build Error (PWA File Size)
Increase the PWA file size limit from 5MB to 6MB to accommodate the growing bundle:

**File:** `vite.config.ts`
- Change `maximumFileSizeToCacheInBytes` from `5 * 1024 * 1024` to `6 * 1024 * 1024`

### 2. Create New Route Summary Component
Create a new `TripSummarySheet.tsx` component that displays:

**File:** `src/components/instructor/TripSummarySheet.tsx`

**Structure:**
```text
┌─────────────────────────────────────────────┐
│  [X]                Trip Summary            │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │         LARGE ROUTE MAP             │    │
│  │    (with start/end markers)         │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│     ⏱️ 1:23:45           📍 8.5 mi         │
│     Duration              Distance          │
├─────────────────────────────────────────────┤
│  [ Speed Over Time Graph - Recharts ]       │
│  ▁▂▃▅▆▇█▇▅▃▂▁▃▅▆▇█▆▄▂                       │
│  0:00                              1:23:45  │
│  Avg: 28 mph    Max: 45 mph                 │
├─────────────────────────────────────────────┤
│  Roads Travelled                    12 roads│
├─────────────────────────────────────────────┤
│  🟢 High Street          30 mph limit       │
│     Avg: 24 mph  Max: 28 mph      ✓ Under   │
│  ─────────────────────────────────────────  │
│  🟡 London Road          40 mph limit       │
│     Avg: 38 mph  Max: 42 mph      ⚠️ At     │
│  ─────────────────────────────────────────  │
│  🔴 M1 Motorway          70 mph limit       │
│     Avg: 65 mph  Max: 78 mph      ❌ Over   │
├─────────────────────────────────────────────┤
│  [ Download PDF ]   [ Share ]   [ Done ]    │
└─────────────────────────────────────────────┘
```

### 3. Speed Over Time Graph
Add a Recharts AreaChart showing speed over the duration of the trip:

- X-axis: Time elapsed (formatted as mm:ss or h:mm:ss)
- Y-axis: Speed in mph
- Line color: Blue gradient
- Show speed limit overlay as a dashed line where known
- Highlight speeding sections in red/orange

**Data transformation:**
- Take the `route` array from the report (contains `{ lat, lon, speed }`)
- Calculate elapsed time for each point based on GPS timestamps
- Create chart data: `{ time: "5:30", speed: 32, speedLimit: 30 }`

### 4. Enhanced Road List with Speed Bars
Each road segment will show:
- Road name with compliance indicator (green/yellow/red dot)
- Speed limit in mph
- Visual bar showing avg speed vs max speed vs limit
- Compliance badge

### 5. Update the Edge Function Response
Enhance `generate-route-report` to include timestamps for the speed graph:

**File:** `supabase/functions/generate-route-report/index.ts`
- Add `recorded_at` to the route point response for time-based graphing
- Include speed limit data per point for the speed limit overlay

### 6. Replace Existing Sheet Implementation
Update `InstructorTraccarSession.tsx` to use the new `TripSummarySheet` instead of the current `SessionRouteReport` in a basic sheet.

## Technical Details

### Speed Graph Data Structure
```typescript
interface SpeedDataPoint {
  elapsedMinutes: number;  // Time from start
  elapsedLabel: string;    // "5:30" format
  speed: number;           // Speed in mph
  speedLimit: number | null; // Current road speed limit
  roadName: string;        // For tooltips
}
```

### Road Segment Card Component
```typescript
interface RoadSegmentCardProps {
  name: string;
  speedLimitMph: number | null;
  avgSpeedMph: number;
  maxSpeedMph: number;
  compliance: 'under' | 'at' | 'over';
}
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/instructor/TripSummarySheet.tsx` | Main summary modal component |
| `src/components/instructor/SpeedTimeGraph.tsx` | Recharts speed over time visualization |
| `src/components/instructor/RoadSegmentCard.tsx` | Individual road segment display |

### Files to Modify
| File | Changes |
|------|---------|
| `vite.config.ts` | Increase PWA file size limit |
| `supabase/functions/generate-route-report/index.ts` | Add timestamps to route response |
| `src/pages/InstructorTraccarSession.tsx` | Use new TripSummarySheet component |

## Mobile Optimization
- Full-screen sheet on mobile (`h-[100dvh]`)
- Scrollable content with sticky header and footer
- Touch-friendly buttons with 44px minimum height
- Responsive stat cards (2 columns on mobile, 4 on desktop)
- Compressed chart height on mobile (150px vs 200px)

## Dependencies
Uses existing dependencies:
- `recharts` (already installed for health trackers)
- `react-leaflet` (already used for maps)
- Shadcn UI components (Card, Badge, Button, Sheet, ScrollArea)
