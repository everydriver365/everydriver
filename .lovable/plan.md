
# Fuel Finder Feature Implementation Plan

## Overview
Add a "Cheapest Fuel" tile to the instructor mobile home page that shows the nearest station with the cheapest petrol, including distance, price, and a "Navigate" button to open directions.

## Technical Architecture

```text
+------------------+     +--------------------+     +------------------+
|   Mobile Home    | --> | useFuelPrices Hook | --> | get-fuel-prices  |
|   FuelCard       |     |   (with caching)   |     | Edge Function    |
+------------------+     +--------------------+     +------------------+
                                                           |
                              +----------------------------+
                              |
                    +---------v----------+
                    | UK Fuel Price APIs |
                    | (14 retailers)     |
                    +--------------------+
```

## Data Sources (Free, No API Key Required)

The UK Government's CMA interim scheme provides free JSON endpoints from 14 major retailers:

| Retailer | Endpoint |
|----------|----------|
| Tesco | https://www.tesco.com/fuel_prices/fuel_prices_data.json |
| Sainsbury's | https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json |
| Asda | https://storelocator.asda.com/fuel_prices_data.json |
| Morrisons | https://www.morrisons.com/fuel-prices/fuel.json |
| BP | https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json |
| Esso/Tesco | https://fuelprices.esso.co.uk/latestdata.json |
| Shell | https://www.shell.co.uk/fuel-prices-data.html |
| JET | https://jetlocal.co.uk/fuel_prices_data.json |
| Motor Fuel Group | https://fuel.motorfuelgroup.com/fuel_prices_data.json |
| Rontec | https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json |
| SGN | https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json |
| Moto | https://moto-way.com/fuel-price/fuel_prices.json |
| Ascona Group | https://fuelprices.asconagroup.co.uk/newfuel.json |

## Implementation Steps

### 1. Create Edge Function: `get-fuel-prices`
**File:** `supabase/functions/get-fuel-prices/index.ts`

The edge function will:
- Accept instructor ID as input
- Fetch instructor's cached lat/lng from database (same pattern as driving-alerts)
- Fetch fuel prices from multiple UK retailer JSON endpoints in parallel
- Calculate distance from instructor's location to each station using Haversine formula
- Filter to stations within a configurable radius (default 15km / ~10 miles)
- Sort by price (E10 unleaded by default)
- Return the cheapest 5 stations with distance
- Cache results for 30 minutes to avoid excessive API calls

**Response structure:**
```json
{
  "stations": [
    {
      "name": "Tesco Extra",
      "brand": "Tesco",
      "address": "123 High Street, Birmingham",
      "postcode": "B1 2CD",
      "lat": 52.4862,
      "lng": -1.8904,
      "distance_km": 2.3,
      "distance_miles": 1.4,
      "prices": {
        "E10": 134.9,
        "E5": 139.9,
        "B7": 142.9
      },
      "updated_at": "2026-02-02T10:30:00Z"
    }
  ],
  "cheapest": { ... },
  "nearest": { ... },
  "fuelType": "E10",
  "location": "Birmingham"
}
```

### 2. Create React Hook: `useFuelPrices`
**File:** `src/hooks/useFuelPrices.ts`

Following the same pattern as `useDrivingAlerts`:
- Local storage caching (30 minute TTL)
- Loading and error states
- Automatic refresh on mount
- Manual refetch function

### 3. Create Fuel Finder Card Component
**File:** `src/components/instructor/FuelFinderCard.tsx`

A compact card showing:
- Cheapest station name and brand logo
- Current E10 price in pence per litre (e.g., "134.9p")
- Distance in miles (e.g., "1.4 mi away")
- "Navigate" button to open Google Maps directions
- Tap card to expand/see more options

### 4. Add Tile to QuickActionTiles
**File:** `src/components/instructor/QuickActionTiles.tsx`

Add to the `additionalTiles` array:
```typescript
{ 
  id: "fuel-finder", 
  title: "Cheapest Fuel", 
  icon: "Fuel", 
  route: "/instructor/fuel", 
  display_order: 118 
}
```

Also add `Fuel` to the `iconMap`.

### 5. Create Full Fuel Finder Page
**File:** `src/pages/InstructorFuel.tsx`

A dedicated page showing:
- Map with all nearby fuel stations plotted
- List of cheapest stations sorted by price
- Filter by fuel type (E10, E5, Diesel)
- Price comparison chart
- "Navigate" button for each station

### 6. Add Route to App.tsx
**File:** `src/App.tsx`

Add route: `/instructor/fuel` -> `InstructorFuel`

### 7. Add Fuel Card to Mobile Home (Optional Enhancement)
**File:** `src/components/instructor/InstructorMobileHome.tsx`

As an optional enhancement, add a compact `FuelFinderCard` directly to the home page feed (similar to driving alerts) showing the cheapest nearby fuel at a glance.

## Technical Details

### Haversine Distance Calculation
```typescript
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### Caching Strategy
- Edge function caches aggregated results for 30 minutes (to reduce API calls)
- Client-side hook caches per instructor for 30 minutes
- Prices update automatically via pull-to-refresh

### Error Handling
- If all API calls fail, show "Unable to fetch prices" message
- If instructor has no location, prompt to set home postcode
- Gracefully handle individual retailer API failures (continue with available data)

## UI Design

**Tile Style (following existing patterns):**
- Uses existing `Fuel` icon from Lucide (already imported in other components)
- Amber/yellow color theme (matches existing fuel cost styling)
- Compact oblong shape in the 2-column grid

**Card Design:**
- Gradient background matching driving alerts style
- Station logo/brand icon
- Price prominently displayed
- Distance shown with appropriate units (miles)
- CTA button for navigation

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/get-fuel-prices/index.ts` | Create |
| `src/hooks/useFuelPrices.ts` | Create |
| `src/components/instructor/FuelFinderCard.tsx` | Create |
| `src/pages/InstructorFuel.tsx` | Create |
| `src/components/instructor/QuickActionTiles.tsx` | Modify (add tile + icon) |
| `src/App.tsx` | Modify (add route) |
| `src/components/instructor/InstructorMobileHome.tsx` | Modify (optional - add card to feed) |

## Dependencies
- No new npm packages required
- No API keys needed (all UK fuel data is free open data)
- Uses existing Supabase infrastructure

## Estimated Complexity
- Edge function: Medium (parallel API fetching, distance calculation)
- Hook: Low (follows existing pattern)
- UI components: Medium (card + full page with map)
- Total: ~4-5 hours of implementation
