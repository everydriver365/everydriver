
# Vehicle Health Dashboard Implementation

## Overview
Add a dedicated "Vehicle Health" page to the instructor mobile and desktop apps that displays real-time GPS device telemetry (battery, ignition status, signal quality) combined with vehicle fleet management data (MOT, insurance, tax expiry, odometer tracking).

## Architecture

### Data Sources

| Source | Data Available | Current Storage |
|--------|----------------|-----------------|
| GPS Device (Traccar) | Battery %, ignition on/off, motion status | Not currently saved |
| instructor_vehicles | Registration, make, model, MOT/insurance/tax expiry, odometer | Exists |
| traccar_devices | Last position, speed, connection status | Exists |
| lesson_telematics | Session distance, alerts, performance stats | Exists |

### Data Flow

```text
Traccar Server (poll every 10s)
       │
       ▼
traccar-poller Edge Function
       │
       ├── Extract: battery, ignition from position.attributes
       │
       ▼
traccar_devices table (new columns)
  • last_battery_percent
  • last_ignition_status
  • vehicle_id (link to fleet)
       │
       ▼
Vehicle Health Page (real-time display)
  • Device status cards
  • Vehicle compliance alerts
  • Session mileage tracking
```

## Implementation Plan

### Phase 1: Database Schema Updates

Add new columns to `traccar_devices` table:
- `vehicle_id` (UUID, FK to instructor_vehicles) - links device to a specific vehicle
- `last_battery_percent` (INTEGER) - stores device battery level 0-100
- `last_ignition_status` (BOOLEAN) - stores ignition on/off state

### Phase 2: Backend Updates (traccar-poller)

Modify `supabase/functions/traccar-poller/index.ts` to:
1. Extract `attributes.battery` and `attributes.ignition` from Traccar position data
2. Save these values to the new `traccar_devices` columns during each poll
3. Continue updating even when position is skipped (for stationary vehicles)

### Phase 3: New Vehicle Health Page

Create `src/pages/InstructorVehicleHealth.tsx` with tabbed interface:

**Tab 1: Live Status**
- Real-time device cards showing:
  - Battery level with color-coded indicator (green/amber/red)
  - Ignition status (on/off with icon)
  - GPS signal quality (based on last accuracy)
  - Connection status (online if last_seen_at < 10s ago)
  - Linked vehicle info (registration, make/model)

**Tab 2: Fleet**
- Vehicle cards with compliance status:
  - MOT expiry countdown badge
  - Insurance expiry countdown badge
  - Tax expiry countdown badge
  - Current odometer reading
  - Link device selector

**Tab 3: Mileage Log**
- Recent tracking sessions with:
  - Date, pupil name, route name
  - Distance covered
  - Auto-accumulation to vehicle odometer

### Phase 4: Navigation Integration

**Mobile Bottom Nav**: Add "Vehicle" icon option (accessible via Menu)

**Menu Page**: Add "Vehicle Health" under Tools section with Car icon

**Route**: `/instructor/vehicle-health`

### Phase 5: Automatic Mileage Tracking

When a tracking session ends:
1. Get final `total_distance_km` from `lesson_telematics`
2. If device has `vehicle_id` linked, add distance to vehicle's `current_odometer_km`
3. Use atomic RPC to prevent race conditions

## UI Design

### Mobile Layout

```text
┌─────────────────────────────────────┐
│  ← Vehicle Health            ⚙️    │
├─────────────────────────────────────┤
│ [Live Status] [Fleet] [Mileage]    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📡 ST-902L (AB12 CDE)       │   │
│  │ ═══════════════────  85%   │   │
│  │ 🔑 Ignition: ON  📍 Online │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📡 Device 2 (Not linked)    │   │
│  │ ═══════════─────────  42%  │   │
│  │ 🔑 Ignition: OFF 📍 Offline│   │
│  │ [Link to Vehicle]           │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Fleet Tab

```text
┌─────────────────────────────────────┐
│  AB12 CDE                    ⭐    │
│  Ford Fiesta (2022) Manual          │
│  ─────────────────────────────────  │
│  📊 45,230 km   🔧 Service: 2,000   │
│  ─────────────────────────────────  │
│  [MOT 45d] [Insurance 120d]         │
│  📡 Linked: ST-902L                 │
└─────────────────────────────────────┘
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Add vehicle_id, last_battery_percent, last_ignition_status to traccar_devices |
| `supabase/functions/traccar-poller/index.ts` | Modify | Save battery/ignition telemetry |
| `src/pages/InstructorVehicleHealth.tsx` | Create | Main vehicle health page |
| `src/components/instructor/vehicle-health/DeviceStatusCard.tsx` | Create | Real-time device card |
| `src/components/instructor/vehicle-health/VehicleFleetCard.tsx` | Create | Vehicle with compliance badges |
| `src/components/instructor/vehicle-health/MileageLogList.tsx` | Create | Session distance history |
| `src/components/instructor/vehicle-health/LinkDeviceDialog.tsx` | Create | Device-to-vehicle linking UI |
| `src/hooks/useVehicleHealth.ts` | Create | Data fetching hook with polling |
| `src/App.tsx` | Modify | Add route for /instructor/vehicle-health |
| `src/pages/InstructorMenu.tsx` | Modify | Add Vehicle Health menu item |

## Technical Details

### Hook: useVehicleHealth

```typescript
// Fetches and combines:
// - traccar_devices with telemetry
// - instructor_vehicles with compliance data
// - Recent lesson_telematics for mileage
// Polls every 5 seconds for near-real-time updates
```

### RPC: increment_vehicle_odometer

```sql
-- Atomically add distance to vehicle odometer
CREATE OR REPLACE FUNCTION increment_vehicle_odometer(
  p_vehicle_id UUID,
  p_distance_km NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE instructor_vehicles
  SET current_odometer_km = COALESCE(current_odometer_km, 0) + p_distance_km
  WHERE id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### End-of-Session Hook

When tracking session ends in `LovableTracker.tsx`:
1. Check if device has linked `vehicle_id`
2. Fetch session's `total_distance_km`
3. Call `increment_vehicle_odometer` RPC
4. Show toast: "Added X km to AB12 CDE"

## Summary

This implementation creates a comprehensive Vehicle Health dashboard that:
1. Shows real-time GPS device telemetry (battery, ignition, connection)
2. Displays vehicle compliance status (MOT, insurance, tax expiry alerts)
3. Links GPS devices to specific vehicles for automatic mileage tracking
4. Integrates seamlessly with existing instructor navigation patterns
