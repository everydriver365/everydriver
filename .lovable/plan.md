
# GPSgate Enhanced Telemetry: Mileage & Fuel Cost Tracking

## Overview

This plan extends the current GPSgate integration to pull more data from the API and display it in the app, specifically focusing on **automatic mileage tracking** and **fuel cost estimation**.

## What Data Can GPSgate Provide?

Based on the GPSgate REST API v1, we can access:

| Data Type | Endpoint | Currently Used |
|-----------|----------|----------------|
| Position & Speed | `/users/{id}/tracks` | Yes |
| Battery & Ignition | `/users/{id}/tracks` | Yes |
| **Odometer (meters)** | `/accumulators` | No |
| **Engine Hours** | `/accumulators` | No |
| **Fuel Consumption Events** | `/fuelconsumption` | No |
| **Trip Summaries** | `/tripinfos` | No |
| **User Status (bulk)** | `/usersstatus` | No |

## Implementation Plan

### Phase 1: Database Schema Updates

Add new columns to track GPSgate-provided odometer and accumulator data:

```sql
-- Add odometer and accumulator tracking to traccar_devices
ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  gpsgate_odometer_m numeric;  -- Total meters from GPSgate

ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  gpsgate_engine_hours_s integer;  -- Engine seconds from GPSgate

ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  last_gpsgate_odometer_m numeric;  -- Previous reading for delta calc

-- Add fuel cost tracking to mileage_logs
ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS 
  estimated_fuel_cost_gbp numeric;  -- Calculated fuel cost

ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS 
  fuel_litres_used numeric;  -- Estimated fuel consumption
```

### Phase 2: Update GPSgate Poller Edge Function

Enhance `gpsgate-poller` to fetch additional data:

1. **Fetch Accumulators (Odometer/Engine Hours)**
   - Call `/applications/{appId}/users/{userId}/accumulators`
   - Store the raw odometer value (in meters)
   - Calculate distance delta since last poll
   - Calculate estimated fuel consumption using instructor's MPG setting

2. **Calculate Trip Distance Automatically**
   - When tracks show ignition OFF after being ON, log a trip
   - Use odometer delta OR sum of GPS distances
   - Auto-create `mileage_logs` entry with fuel cost estimate

3. **Fuel Cost Formula**
   ```
   distance_km = odometer_delta_m / 1000
   distance_miles = distance_km * 0.621371
   gallons_used = distance_miles / vehicle_mpg
   litres_used = gallons_used * 4.546
   fuel_cost_gbp = litres_used * fuel_cost_per_litre
   ```

### Phase 3: New UI Components

#### 3.1 Enhanced Live Telemetry Card
Update `EnhancedDeviceStatusCard` to show:
- **Current Odometer** (in miles, from GPSgate)
- **Engine Hours** (formatted as HH:MM)
- **Today's Distance** (auto-calculated from odometer delta)
- **Estimated Fuel Cost Today** (based on instructor settings)

#### 3.2 New "Running Costs" Dashboard Tab
Add a new tab to Vehicle Health page:

```
┌─────────────────────────────────────────────────┐
│  📊 Running Costs                               │
├─────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ This Week │  │This Month │  │ Tax Year  │   │
│  │  £47.20   │  │  £183.50  │  │ £1,847.00 │   │
│  │  142 mi   │  │   551 mi  │  │  5,541 mi │   │
│  └───────────┘  └───────────┘  └───────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Fuel Cost Breakdown (Chart)             │   │
│  │ [=============================]         │   │
│  │ £/mile: 0.33  |  MPG: 40  |  £1.45/L   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Recent Trips                            │   │
│  │ • Today 9:15am - 12.3 mi - £4.07       │   │
│  │ • Yesterday 2pm - 28.1 mi - £9.27      │   │
│  │ • Yesterday 9am - 15.6 mi - £5.15      │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### 3.3 Auto-Trip Detection in Mileage Log
Update `AutoMileageLog` to show trips auto-detected from GPSgate:
- Trip start/end times
- Distance (auto from GPS)
- Fuel cost estimate
- Business/Personal toggle (defaults to business if during scheduled lesson)

### Phase 4: Fuel Cost Settings

Ensure instructor settings include:
- **Vehicle MPG** (already exists: `vehicle_mpg`)
- **Fuel Cost Per Litre** (already exists: `fuel_cost_per_litre`)

These are already in the database and used in earnings calculations.

---

## Technical Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/instructor/vehicle-health/RunningCostsTab.tsx` | New tab for fuel costs dashboard |
| `src/components/instructor/vehicle-health/TripCostCard.tsx` | Individual trip with fuel cost |
| `src/hooks/useRunningCosts.ts` | Hook to fetch mileage + calculate costs |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/gpsgate-poller/index.ts` | Add accumulators fetch, trip detection, auto-mileage logging |
| `src/pages/InstructorVehicleHealth.tsx` | Add "Costs" tab |
| `src/components/instructor/vehicle-health/EnhancedDeviceStatusCard.tsx` | Show odometer, today's distance, fuel cost |
| `src/components/instructor/vehicle-health/AutoMileageLog.tsx` | Show fuel cost column |
| `src/hooks/useMileageLogs.ts` | Include fuel cost in summary |

### Database Migrations

1. Add `gpsgate_odometer_m` and `gpsgate_engine_hours_s` to `traccar_devices`
2. Add `estimated_fuel_cost_gbp` and `fuel_litres_used` to `mileage_logs`

---

## Summary

This implementation will:
1. Pull odometer readings automatically from GPSgate
2. Calculate fuel costs based on distance and instructor MPG/fuel settings
3. Auto-log trips when ignition cycles are detected
4. Display running costs in a new dashboard tab
5. Show real-time odometer and estimated daily fuel spend on device cards
6. Integrate with existing HMRC mileage allowance calculations

All distances will be displayed in **miles** (Imperial) per the existing system preference.
