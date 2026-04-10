

## Fix: Live Tracking Map Not Showing Data

### Root Cause

The `GoogleLiveTrackingMap` component independently queries `gps_devices` with `.eq("is_active", true).single()`. When an instructor has multiple active devices (which is the case — there are 2 active devices for the current instructor), the `.single()` call returns an error because it expects exactly 1 row. This silently fails, so no device is loaded and no live data appears on the map.

### Plan

**1. Pass device ID from parent to map component**

In `InstructorLiveSession.tsx`, the parent already knows which device is selected. Pass the device ID as a prop to `LiveTrackingMap`:

```tsx
<LiveTrackingMap className="absolute inset-0" deviceId={device.id} />
```

**2. Update GoogleLiveTrackingMap to accept and use the device ID prop**

In `GoogleLiveTrackingMap.tsx`:
- Add a `deviceId` prop to the component
- Change the device query from `.eq("is_active", true).single()` to `.eq("id", deviceId).single()` when a `deviceId` prop is provided
- Fall back to the current behavior (first active device) if no prop is given, but use `.limit(1).maybeSingle()` instead of `.single()` to avoid the multi-row error

**3. Fix the standalone fallback query**

Even without the prop, the independent query should not break with multiple devices. Change:
```ts
.eq("is_active", true).single()
```
to:
```ts
.eq("is_active", true).order("last_seen_at", { ascending: false }).limit(1).maybeSingle()
```

This ensures the map always picks the most recently seen device and never errors on multiple rows.

### Files to edit
- `src/components/instructor/GoogleLiveTrackingMap.tsx` — accept `deviceId` prop, fix query
- `src/pages/InstructorLiveSession.tsx` — pass `device.id` to `LiveTrackingMap`

