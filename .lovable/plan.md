

## Reduce Live Tracking Delay

### Current Pipeline (worst case ~30-40s delay)
```text
Device → Geotab Cloud (~5-15s) → Poller Edge Fn (every 10s) → DB Write → Realtime → Client
```

### Why Geotab's Screen Is Faster
Geotab's MyGeotab dashboard uses a proprietary persistent WebSocket directly to their servers. Their public API only offers polling endpoints, so we can never fully match their speed — but we can get close.

### Proposed Improvements

**1. Increase poller frequency from 10s to 5s**
- Update the pg_cron schedule for `geotab-poller` from `10 seconds` to `5 seconds`
- The poller is already lightweight (single batched API call), so this is safe

**2. Optimize the batched API call**
- The poller currently fetches diagnostics, faults, exception events, and media alongside position data — all in one massive multicall
- Split into two paths: a **fast position-only poll** (every 5s) and a **slow diagnostics/faults poll** (every 60s)
- This cuts the API response time significantly for the position update

**3. Client-side: reduce GPS trail fetch interval**
- In `GoogleLiveTrackingMap.tsx`, the GPS trail points are fetched every 3 seconds (line 408) but the poller only writes every 10s, so most fetches return stale data
- Align this to match the poller cadence, or rely purely on Realtime subscription for position updates (already in place)

**4. Add Geotab Data Feed (optional, advanced)**
- Geotab offers a "Data Feed" API (`GetFeed`) that returns only new records since a version token — this is more efficient than re-fetching `DeviceStatusInfo` each time
- Switching to `GetFeed` for `LogRecord` (GPS) would reduce API response size and latency

### Files to Change
- **Migration SQL** — update cron schedule to 5 seconds
- `supabase/functions/geotab-poller/index.ts` — split fast/slow polling paths
- `src/components/instructor/GoogleLiveTrackingMap.tsx` — adjust trail fetch timing

### Expected Result
Reduce end-to-end delay from ~30-40s to ~10-15s (limited by Geotab's own device reporting interval).

