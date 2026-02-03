
# Fix GPSgate Position, Road Name, and Speed Limit Display

## ✅ COMPLETED

The issue has been fixed. The GPSgate API returns data in a **nested format** that was different from what the original code expected.

### Root Cause Found
The GPSgate Cloud API returns track data in this format:
```json
{
  "position": {
    "latitude": 50.9307449,
    "longitude": -1.2948283,
    "altitude": 30.8
  },
  "velocity": {
    "groundSpeed": 0,
    "heading": 0
  },
  "variables": {
    "batteryLevel": 90,
    "speed": 0,
    "accuracy": 2
  },
  "utc": "2026-02-03T08:04:49Z"
}
```

The original code expected flat fields like `Lat`, `Lng`, `Speed`, `Time`.

### Changes Made

**File: `supabase/functions/gpsgate-poller/index.ts`**

1. ✅ Added debug logging to reveal the GPSgate response structure
2. ✅ Created flexible helper functions to extract data from multiple formats:
   - `extractPosition()` - handles nested `position.latitude/longitude` and flat `Lat/Lng`
   - `extractSpeed()` - handles nested `velocity.groundSpeed` and flat `Speed`
   - `extractHeading()` - handles nested `velocity.heading` and flat `Heading`
   - `extractTime()` - handles `utc`, `serverUtc`, `Time`, `Timestamp`
   - `extractAltitude()` - handles nested `position.altitude` and flat `Altitude`
   - `extractBattery()` - handles nested `variables.batteryLevel` and flat `Battery`

3. ✅ Updated all track parsing to use the helper functions
4. ✅ Added validation to skip tracks with no valid position (prevents stale data display)

### Verified Working

After deployment:
- **Position**: lat=50.9307449, lon=-1.29483 ✅
- **Road Name**: "Watkin Road" (from Mapbox) ✅
- **Speed Limit**: 48 km/h (from OSM) ✅
- **Battery**: 85% ✅
- **Speed**: 0 km/h ✅

### UI Already Had

The `InstructorTraccarSession.tsx` page already has:
- Stale data banner showing "Last update X mins ago. Showing last known location." ✅
- Road name display in the map component ✅
- Speed limit roundel in the map component ✅
