

## Fix: Stale Closure in Fleet Map Marker Click Handler

### Problem
The marker click handler (line 200-217) captures `devices` from the effect closure when the marker is first created. After realtime updates change `devices` state, clicking a marker still references the old array, showing stale speed/road/ignition data in the popup.

### Solution
Use a `useRef` to always hold the latest `devices` array, and reference that ref inside the click handler instead of the closure variable.

### Changes — `src/pages/InstructorFleetMap.tsx`

1. Add a `devicesRef` that tracks the latest `devices` state:
   ```typescript
   const devicesRef = useRef<FleetDevice[]>([]);
   // Keep ref in sync
   useEffect(() => { devicesRef.current = devices; }, [devices]);
   ```

2. In the marker click handler (line 201), replace:
   ```typescript
   const d = devices.find((dd) => dd.id === device.id) || device;
   ```
   with:
   ```typescript
   const d = devicesRef.current.find((dd) => dd.id === device.id) || device;
   ```

This ensures the popup always shows the most current data regardless of when the marker was created.

### No other changes needed
The popup content itself is correct — it shows speed, limit, road, ignition, last seen, and signal-lost warning as designed.

