
# Fix Tracking System: Mapbox 422 Error, Full Screen, and Bottom Nav Overlap

## Issues Identified

### 1. Mapbox API Returns 422 Error
**Logs show:**
```
[Traccar] Mapbox API returned 422
[Traccar] Mapbox road info lookup at 50.930739,-1.294842
```

**Root Cause:** The Mapbox Map Matching API is failing because:
- The 10m offset (0.0001 degrees) may be too small or causing invalid geometry
- The coordinate format or request structure may not meet API requirements
- The API may require timestamps or additional parameters

**Fix:** Update the `getRoadInfo` function in `traccar-webhook` to use a larger offset (50m instead of 10m) and add `tidy=true` parameter to help with sparse coordinates.

### 2. Road Name Not Displaying
**Current State:** Shows "Locating road..." because Mapbox is returning 422 errors.

**Fix:** Once Mapbox API is fixed, road names will flow through correctly. Add fallback to show coordinates when road lookup fails.

### 3. Full Screen Not Working
**Root Cause:** The `InstructorBottomNav` is rendered at the bottom of the page (line 960), which takes up space and prevents the map from being truly full-screen during active sessions.

**Current Layout:**
```
- Warning Banner (if not connected)
- Header (sticky)
- Map Container (flex-1)
- InstructorBottomNav (always visible - 64px + safe area)
```

**Fix:** Hide `InstructorBottomNav` when a tracking session is active. The map should take the full viewport during tracking.

### 4. Speeds Obscured by Bottom Nav Bar
**Root Cause:** The `TraccarLiveMap` component has its speed panel positioned at `bottom-0`, but the `InstructorBottomNav` also sits at the bottom with a fixed height of 64px. This causes overlap.

**Speed Panel in TraccarLiveMap.tsx (line 409):**
```jsx
<div className="absolute bottom-0 left-0 right-0 z-20">
```

**Fix:** Either:
- Option A: Hide bottom nav during tracking (recommended - matches Apple Maps/Google Maps behavior)
- Option B: Add padding-bottom to the map container to account for nav height

---

## Technical Plan

### File 1: `supabase/functions/traccar-webhook/index.ts`

**Fix Mapbox 422 Error (lines 101-107):**

Change the coordinate generation to use a larger offset and add the `tidy=true` parameter:

```typescript
// Before:
const offset = 0.0001; // ~10m
const coords = `${lon},${lat};${lon + offset},${lat + offset}`;

const response = await fetch(
  `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}&annotations=maxspeed&geometries=geojson`,
  { signal: AbortSignal.timeout(3000) }
);

// After:
const offset = 0.0005; // ~50m - larger offset for better road matching
const coords = `${lon},${lat};${lon + offset},${lat}`;

const response = await fetch(
  `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}&annotations=maxspeed&geometries=geojson&tidy=true&radiuses=25;25`,
  { signal: AbortSignal.timeout(3000) }
);
```

Key changes:
- Increase offset from 10m to 50m for better road snapping
- Add `tidy=true` to clean up sparse coordinates
- Add `radiuses=25;25` to set GPS accuracy tolerance
- Keep longitude-only offset (don't change both lat and lon)

### File 2: `src/pages/InstructorTraccarSession.tsx`

**Hide Bottom Nav During Active Session (line 960):**

```tsx
// Before:
<InstructorBottomNav />

// After:
{!isSessionActive && <InstructorBottomNav />}
```

This hides the bottom navigation bar when a tracking session is active, giving the map true full-screen behavior.

### File 3: `src/components/instructor/TraccarLiveMap.tsx`

**Add Fallback Road Name Display (lines 383-385):**

```tsx
// Before:
<p className="text-gray-900 font-semibold text-lg truncate">
  {roadName || "Locating road..."}
</p>

// After:
<p className="text-gray-900 font-semibold text-lg truncate">
  {roadName || (latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Locating road...")}
</p>
```

This shows coordinates as a fallback when road name is unavailable, which is more useful than "Locating road...".

---

## Data Flow After Fix

```
Traccar App sends GPS data
        |
traccar-webhook receives data
        |
+---> Mapbox Map Matching API (fixed: 50m offset, tidy=true, radiuses)
        |
        +-- Road Name extracted from tracepoints
        +-- Speed Limit extracted from annotations
        |
traccar_devices table updated
        |
Frontend reads via Realtime subscription
        |
TraccarLiveMap displays:
  - Road name (or coordinates fallback)
  - Speed limit in roundel
  - Current speed
  - Route polyline (full screen, no bottom nav overlap)
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `traccar-webhook/index.ts` | Fix Mapbox API call (larger offset, tidy, radiuses) | Fixes 422 errors, enables road/speed limit detection |
| `InstructorTraccarSession.tsx` | Hide bottom nav during active session | Enables true full-screen map |
| `TraccarLiveMap.tsx` | Show coordinates as fallback for road name | Better UX when road lookup fails |

---

## Testing Steps

After deployment:
1. Start a tracking session (Test Route or with pupil)
2. Verify the bottom navigation bar is hidden
3. Verify the speed panel is fully visible at the bottom
4. Check backend logs for `[Traccar] Mapbox road info:` instead of `422` errors
5. Verify road names appear in the banner
6. Verify speed limits display in the roundel
