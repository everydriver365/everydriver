

# Fix Geotab Rate Limiting and Keep the Live Map Working

## What's Happening Now
The tracker is being called every 5 seconds, but Geotab only allows **10 API calls per minute**. Each call currently makes 5-6 separate requests to Geotab, totalling ~70 calls/minute. Most are rejected, so the map data goes stale and updates unreliably.

## The Fix (3 Changes)

### 1. Slow the cron back to every 10 seconds
- Unschedule the current `geotab-poller-5s` cron job (jobid 10)
- Create a new `geotab-poller-10s` cron job at **10-second intervals** (6 invocations/minute)

### 2. Batch all Geotab calls into one request
Geotab supports `ExecuteMultiMethod` -- a single HTTP call that runs multiple API methods at once. Each invocation will make **1 API call instead of 5**, combining:
- `Get Device` (device list)
- `Get DeviceStatusInfo` (position, speed, heading)
- `GetPostedRoadSpeedsForDevice` (speed limit)

This brings total usage to **~7 calls/minute** (6 batched polls + occasional auth), well under the 10/min limit.

### 3. Remove broken calls and throttle non-essential ones
- **Remove `fetchDriverMap`** from every poll -- it fails every single time with a cast error and wastes an API call
- **Run media sync only every 6th invocation** (~once per minute) -- dashcam clips don't need 10-second freshness
- **Cache the device list** for 5 minutes instead of fetching from Geotab every poll

## What This Means for Your Live Map

| What | Before (broken) | After (fixed) |
|------|-----------------|---------------|
| Update frequency | Unreliable (rate limited) | Every 10 seconds, reliably |
| Speed data | Sometimes missing | Always present |
| Speed limit | Sometimes missing | Always present |
| Road name | Sometimes missing | Always present |
| Map movement | Stuttery/stale | Smooth 10-second updates |

The live map on your phone uses real-time database subscriptions, so it updates within ~1 second of the server writing new data. The 10-second interval is the server fetch delay, not what you see on screen.

## Technical Details

### File: `supabase/functions/geotab-poller/index.ts`

**Add `ExecuteMultiMethod` helper:**
```text
Replaces individual geotabCall() calls for Device, DeviceStatusInfo,
and PostedRoadSpeedsForDevice with a single batched HTTP request.
```

**Add device list caching:**
```text
Store the serial-to-internal-ID mapping with a 5-minute TTL.
Only re-fetch from Geotab when the cache expires.
```

**Remove `fetchDriverMap` from hot path:**
```text
Delete the call on line 311 that runs every poll and always fails.
Only fetch drivers during media sync (once per minute).
```

**Throttle media sync:**
```text
Add a timestamp check so media/dashcam sync only runs
every ~60 seconds instead of every 10 seconds.
```

**Fix distance calculation:**
```text
Line 286: change (speed * 5) / 3600 back to (speed * 10) / 3600
to match the 10-second interval.
```

### Database: Cron job
- Unschedule job 10 (`geotab-poller-5s`)
- Create new job at `10 seconds` interval

