

## Plan: Only Show Connected Devices

### Problem
The device "Charlotte" appears in the device list despite having no telemetry data (null `last_seen_at`, no coordinates, no battery). Only devices that have actually reported in should be displayed.

### Solution
Filter devices in `useVehicleHealth.ts` after fetching — remove any device where `last_seen_at` is null AND `last_heartbeat_at` is null. This keeps the raw data available but prevents ghost devices from cluttering the UI.

### File: `src/hooks/useVehicleHealth.ts`

After the query returns devices (~line 131), add a filter:

```typescript
const activeDevices = (devices || []).filter(
  d => d.last_seen_at !== null || d.last_heartbeat_at !== null
);
```

Then use `activeDevices` instead of `devices` for the rest of the function (vehicle lookup, mapping, etc.).

This single change propagates everywhere — `LiveTelemetryTab`, `GeotabOverviewTab`, `EnhancedDeviceStatusCard`, and `MaintenanceAlertsBanner` all consume from the same hook.

### Also fix: Maintenance service reminders 400 error

The network requests show a repeated 400 error: `invalid input syntax for type integer: "25161.2"`. The `last_service_km` and `next_due_km` columns are integers but the code passes decimal values from `last_ecu_odometer_km`.

**File**: `src/hooks/useAutoMaintenanceSetup.ts` — wrap odometer values with `Math.round()` before inserting into `vehicle_service_reminders`.

