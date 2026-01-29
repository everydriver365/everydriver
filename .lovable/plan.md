

# Fix Live Tracking Display Issues

## Problem Identified

The Live Tracking screen shows a map with a marker, but:
- **Marker doesn't move** as the vehicle moves
- **Road name is wrong** or stale
- **Speed and speed limit are not displayed** in the bottom panel

## Root Cause Analysis

After investigating the database and edge function logs:

**The backend is working correctly:**
- GPS data is being received every 1-3 seconds from Traccar Client
- Speed is being recorded (currently ~47 km/h / 29 mph)
- Road name ("Tollbar Way") and speed limit (64 km/h / 40 mph) are being resolved
- All data is stored in `traccar_devices` and `telematics_gps_points` tables

**The frontend has a data display issue:**
The `InstructorTraccarSession` page fetches the device once on load, then relies on Supabase Realtime subscriptions to receive updates. There are two potential failure points:

1. **Realtime subscription not triggering** - The subscription filters on `id=eq.{device.id}` but if the initial fetch fails to get the device ID, updates won't flow
2. **Props not updating the map component** - The `TraccarLiveMap` receives props but may not be re-rendering when state updates
3. **Published app has stale code** - Recent fixes may not have been published yet

## Implementation Plan

### Step 1: Add Debug Logging (Diagnostic)
Add console logs to trace whether device updates are being received in the component.

### Step 2: Fix Polling Reliability
Ensure the 3-second polling fallback is working and actively updating state with all device fields (speed, lat, lon, heading, road name, speed limit).

### Step 3: Fix Realtime Subscription
Ensure the Realtime subscription is correctly established after the device ID is available, and that it triggers state updates.

### Step 4: Verify Data Flow to Map Component
Confirm that when `device` state updates, the props passed to `TraccarLiveMap` also update and cause a re-render.

## Technical Details

### File: `src/pages/InstructorTraccarSession.tsx`

**Current Flow (lines 178-245):**
```text
1. Device is loaded once in fetchData()
2. Realtime channel subscribes to device-rt-{device.id}
3. pollDevice() runs every 3s as fallback
4. Device state updates should flow to TraccarLiveMap props
```

**Issue:** The Realtime subscription is created in a `useEffect` that depends on `device?.id`, but if `device` is initially null, the subscription may not be set up correctly until after a re-render.

**Fix:**
1. Move the initial device fetch into the same effect that sets up realtime
2. Ensure `pollDevice` is called immediately after subscription
3. Add explicit state updates for all device fields

### File: `src/components/instructor/TraccarLiveMap.tsx`

**Current Flow (lines 36-47):**
- Props: `latitude`, `longitude`, `heading`, `speedKmh`, `speedLimitKmh`, `roadName`
- These should update the marker position and bottom panel

**Verify:** Ensure the component re-renders when props change (currently it does via standard React prop updates).

## Summary of Changes

| File | Change |
|------|--------|
| `InstructorTraccarSession.tsx` | Fix device polling to ensure state updates trigger re-renders; ensure Realtime subscription is established correctly |
| `TraccarLiveMap.tsx` | Already correct - no changes needed |

## After Implementation

1. Test the preview to verify live updates work
2. **Publish the app** to make changes live on everydriver.lovable.app

