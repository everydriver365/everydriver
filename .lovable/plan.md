

## Increase map update frequency to 2 seconds

### What needs to change
There are two polling intervals on the live tracking page (`InstructorLiveSession.tsx`) that control how often the map refreshes:

1. **Device fallback poller** (line 308): Currently `5000ms` — polls `gps_devices` for latest position
2. **Trail edge-function poller** (line 486 in `GoogleLiveTrackingMap.tsx`): Currently `3000ms` — triggers the trail poller edge function

The `useLivePupilPositions` hook already defaults to `2000ms`, so no change needed there.

### Changes

1. **`src/pages/InstructorLiveSession.tsx`** — Change the device fallback poll interval from `5000` to `2000` (line 308)
2. **`src/components/instructor/GoogleLiveTrackingMap.tsx`** — Change the trail poller interval from `3000` to `2000` (line 486)

Both are single-number changes. The realtime subscriptions remain unchanged (they fire instantly on DB changes), so these intervals only affect the fallback/supplementary polling.

