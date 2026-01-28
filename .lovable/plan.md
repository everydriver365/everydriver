
# Fix: Live Tracking for Test Route Mode (No Pupil)

## Problem Summary

When starting a tracking session without selecting a pupil ("Start Test Route" mode), the following breaks:

1. **Speed limits not displayed** - The `update_live_position` RPC requires a `pupil_id`, so it fails for pupil-less sessions
2. **Route line not updating in realtime** - Realtime subscription filters on `pupil_id` which is null
3. **Speed updates delayed** - Without live position updates, the UI falls back to 5-second polling of `traccar_devices`

## Solution Architecture

Create a parallel data flow for "instructor-level" live tracking that doesn't depend on pupils:

```text
+------------------+     +------------------+     +---------------------+
| Traccar Webhook  | --> | traccar_devices  | --> | UI (polling + RT)   |
|                  |     | (always updated) |     |                     |
|                  |     +------------------+     +---------------------+
|                  |                              
|                  |     +----------------------+  +---------------------+
|                  | --> | live_pupil_positions | --> | UI (RT sub)       |
|                  |     | (only if pupil set)  |  | (pupil sessions)    |
+------------------+     +----------------------+  +---------------------+
```

## Implementation Plan

### 1. Enhance `traccar_devices` table with speed limit

Add `last_speed_limit_kmh` column to `traccar_devices` so the webhook can always store the current speed limit regardless of pupil selection.

Database change:
```sql
ALTER TABLE traccar_devices ADD COLUMN last_speed_limit_kmh NUMERIC DEFAULT NULL;
```

### 2. Update `traccar-webhook` edge function

Modify the webhook to:
- Always update `traccar_devices.last_speed_limit_kmh` (not just when pupil is set)
- Continue calling `update_live_position` only when a pupil is assigned

### 3. Update `InstructorTraccarSession.tsx` UI

Modify the page to:
- Subscribe to `traccar_devices` Realtime changes (not just `live_pupil_positions`)
- Use `device.last_speed_limit_kmh` for speed limit display
- Remove dependency on `live_pupil_positions` for test route mode

### 4. Update `TraccarLiveMap.tsx` for route polyline

Modify the map to:
- Subscribe to `telematics_gps_points` Realtime for route updates (already done, but verify it works for all sessions)
- Use `traccar_devices` for vehicle marker position when no pupil

### 5. Enable Realtime on `traccar_devices` table

Ensure the table is added to `supabase_realtime` publication.

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/traccar-webhook/index.ts` | Update device with `last_speed_limit_kmh` always |
| `src/pages/InstructorTraccarSession.tsx` | Subscribe to `traccar_devices` Realtime; read speed limit from device |
| `src/components/instructor/TraccarLiveMap.tsx` | Minor adjustment to use device data when no pupil |
| Database migration | Add `last_speed_limit_kmh` column + enable Realtime |

## Expected Result After Fix

| Feature | Before Fix | After Fix |
|---------|------------|-----------|
| Speed limit (with pupil) | Works | Works |
| Speed limit (test route) | Broken | Works |
| Route line (with pupil) | Works | Works |
| Route line (test route) | Delayed | Instant |
| Speed updates | 5s polling | Realtime |

## Technical Details

### Database Migration
```sql
-- Add speed limit column to traccar_devices
ALTER TABLE public.traccar_devices 
ADD COLUMN IF NOT EXISTS last_speed_limit_kmh NUMERIC DEFAULT NULL;

-- Enable realtime for traccar_devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.traccar_devices;
```

### Webhook Change (Key Section)
```typescript
// Always update device with speed limit (not just when session active)
const { error: updateError } = await supabase
  .from("traccar_devices")
  .update({
    last_speed_kmh: speedKmh,
    last_latitude: lat,
    last_longitude: lon,
    last_heading: bearing,
    last_seen_at: now.toISOString(),
    last_speed_limit_kmh: speedLimitKmh, // NEW: Always store speed limit
  })
  .eq("id", typedDevice.id);
```

### UI Realtime Subscription (Key Section)
```typescript
// Subscribe to device changes for instant updates
const channel = supabase
  .channel(`device-${device.id}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "traccar_devices",
      filter: `id=eq.${device.id}`,
    },
    (payload) => {
      const newDevice = payload.new as TraccarDevice;
      setDevice(newDevice);
      setSpeedLimitKmh(newDevice.last_speed_limit_kmh);
    }
  )
  .subscribe();
```
