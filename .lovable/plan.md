

## Plan: Add Fuel/MPG Data to Trip History & Trip Detail Sheet

### What changes

The `geotab_fuel_usage` table already stores per-trip fuel data (litres, distance, cost). Currently this data only appears on the dedicated Fuel tab. This plan surfaces it directly on the Trip History table and Trip Detail drawer.

### Approach

**1. Fetch fuel data alongside trips in `GeotabTripHistory.tsx`**
- Import `useGeotabFuelUsage` hook (already exists)
- Call it with the same date range as the trips query
- Build a lookup map keyed by `trip_start` timestamp to match fuel records to trips
- Matching logic: find a fuel record whose `trip_start` is within 60 seconds of the Geotab trip's `startTime`

**2. Add MPG and Cost columns to the trip table**
- Add a "MPG" column header (with Fuel icon) after the Max Speed column
- Add a "Cost" column header (with £ icon) after MPG
- Both hidden on mobile (`hidden sm:table-cell`)
- Each row looks up the matched fuel record and displays: MPG (calculated from distance_km and fuel_used_litres) and `£X.XX`
- Show "—" when no fuel data is available for a trip

**3. Add fuel section to `TripDetailSheet.tsx`**
- Accept an optional `fuelRecord` prop (type from `useGeotabFuelUsage`)
- Add a "Fuel" card row to the summary grid: Fuel (litres), MPG, Cost
- Add a "Fuel Economy" analysis section below the speed analysis, showing litres/100km and MPG with a visual bar
- Include fuel data in the PDF report and CSV export

**4. Pass fuel data from TripHistory to TripDetailSheet**
- When a trip is selected, find its matching fuel record and pass it as a prop

### Files changed

| File | Change |
|------|--------|
| `src/components/instructor/geotab/GeotabTripHistory.tsx` | Import fuel hook, build lookup map, add 2 table columns, pass fuel prop to detail sheet |
| `src/components/instructor/geotab/TripDetailSheet.tsx` | Accept `fuelRecord` prop, add fuel cards, fuel analysis section, update PDF/CSV |

### Technical notes
- Fuel matching uses timestamp proximity (±60s) since the edge function stores `trip_start` from Geotab's trip object, which should match closely
- MPG calculation: `(distance_km * 0.621371) / (fuel_used_litres * 0.219969)`
- No database or edge function changes needed — all data already exists

