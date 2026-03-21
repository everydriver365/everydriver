

## Plan: Add GPS Position, DTC Faults, Seatbelt & Tyre Pressure to Vehicle Health Page

### Current State
- `GeotabExtendedDiagnosticsTab` (seatbelt, tyre pressure, etc.) and `GeotabFaultCodesTab` (DTC codes) already exist as components
- They're used in the Geotab Hub and Admin pages but **not** on the `InstructorVehicleHealth` page
- `MiniLiveMap` component exists for real-time GPS display
- The Vehicle Health "Live" tab only shows device cards, battery history, and ignition events

### Changes

#### 1. Expand LiveTelemetryTab with new sub-tabs

**File**: `src/components/instructor/vehicle-health/LiveTelemetryTab.tsx`

Add 3 new sub-tabs alongside existing Devices/Battery/Ignition:
- **GPS** — embed `MiniLiveMap` showing real-time position of selected device
- **Sensors** — embed `GeotabExtendedDiagnosticsTab` (seatbelt, tyre pressure, ambient temp, etc.)
- **Faults** — embed `GeotabFaultCodesTab` (active DTC codes)

Change the grid from `grid-cols-3` to `grid-cols-6` (or use a scrollable tab list) and add:

```
<TabsTrigger value="gps">GPS</TabsTrigger>
<TabsTrigger value="sensors">Sensors</TabsTrigger>
<TabsTrigger value="faults">Faults</TabsTrigger>
```

- **GPS tab**: Show `MiniLiveMap` for the selected device using its `last_latitude`/`last_longitude`/`heading` from the device data already available
- **Sensors tab**: Render `<GeotabExtendedDiagnosticsTab />` (reuses existing component, already shows seatbelt + tyre pressure)
- **Faults tab**: Render `<GeotabFaultCodesTab />` (reuses existing component)

Both sensor/fault tabs are gated on `tracking_provider === "geotab"` — non-Geotab users see a placeholder message.

### Files

| Action | File |
|--------|------|
| Edit | `src/components/instructor/vehicle-health/LiveTelemetryTab.tsx` — add GPS, Sensors, Faults sub-tabs |

This is a lightweight integration since all underlying components and data hooks already exist.

