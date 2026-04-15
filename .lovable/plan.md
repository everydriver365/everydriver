

# Add Dashcam & Panic Button Status from Radius IO Data

## What we know

The Radius Export Stream already sends IO data with every telemetry update:
```json
{
  "button_01": { "type": "digital", "name": "Panic Button", "value": 0, "text": "Off" },
  "camera_01": { "type": "camera", "name": "FRONT", "value": 0, "text": "Off" }
}
```

This data is logged but discarded. We need to capture it and display it.

## Changes

### Step 1 — Database migration
Add two new columns to `gps_devices`:
```sql
ALTER TABLE public.gps_devices
  ADD COLUMN IF NOT EXISTS last_dashcam_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_panic_pressed boolean DEFAULT false;
```

### Step 2 — Extract IO fields in `radius-poller/index.ts`
- Add `dashcam_active` and `panic_pressed` to `NormalisedPosition` interface
- In the Export Stream mapping, extract: `item.io?.camera_01?.value === 1` and `item.io?.button_01?.value === 1`
- In the DB update block (~line 558), write these to the new columns

### Step 3 — Update `GPSDeviceHealth` interface in `useVehicleHealth.ts`
Add `last_dashcam_active` and `last_panic_pressed` fields and include them in the select query.

### Step 4 — Display on `EnhancedDeviceStatusCard.tsx`
Add a small row below the Battery/Ignition grid showing:
- **Dashcam**: Camera icon with "Recording" (green) or "Off" (grey) badge
- **Panic Button**: AlertTriangle icon, only shown when pressed (red alert style), otherwise a subtle "OK" indicator

### Step 5 — Display on `TelematicsTile.tsx` (homepage)
When expanded, show small inline indicators for dashcam and panic status alongside the existing metrics.

## Files changed
1. Database migration (2 columns)
2. `supabase/functions/radius-poller/index.ts` — extract IO fields
3. `src/hooks/useVehicleHealth.ts` — add fields to interface and query
4. `src/components/instructor/vehicle-health/EnhancedDeviceStatusCard.tsx` — display status
5. `src/components/instructor/TelematicsTile.tsx` — display status in expanded view

