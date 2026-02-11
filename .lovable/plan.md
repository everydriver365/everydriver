

# Alternative Tracking Architecture: Server-Side Polling

## The Problem

The current tracking system relies on **client-side polling** -- the instructor's phone calls the `quartix-poller` backend function every 2-10 seconds. This creates several failure points:

- If the user switches apps, locks their phone, or refreshes the page, polling stops and tracking breaks
- Every poll re-authenticates with Quartix (slow, wasteful, and prone to rate-limiting)
- If the user's login session expires, tracking silently dies
- Orphaned sessions pile up (168 found and cleaned today) because there's no server-side session management
- The single poller function does too much: auth + vehicle sync + position fetch + GPS recording + geofencing + speed limits + reverse geocoding

## The Solution: Server-Side Cron Polling

Move ALL polling to the server using `pg_cron` (already enabled). The instructor's phone becomes a **read-only display** that subscribes to real-time database updates -- it never calls Quartix directly.

```text
CURRENT (broken):                    PROPOSED (reliable):

Phone --> quartix-poller --> Quartix  pg_cron --> quartix-sync --> Quartix
  |           |                            |
  |     (every 2-10s)                 (every 15s, always running)
  |           |                            |
  |     gps_devices table             gps_devices table
  |           |                            |
  +--- reads from DB                  Phone <-- realtime subscription
```

## Implementation Steps

### Step 1: Create a new `quartix-sync` edge function
A streamlined server-side function that:
- **Caches the Quartix auth token** in the database (tokens last ~30 minutes) instead of authenticating every call
- Fetches live positions from Quartix API
- Updates `gps_devices` with latest position data
- Records GPS points for active sessions
- Handles distance accumulation
- Runs geofence and movement checks

Deferred operations (speed limit lookups, reverse geocoding) run on a **separate, slower schedule** (every 60s) to avoid overloading external APIs.

### Step 2: Set up pg_cron schedules
- **Core position sync**: Every 15 seconds via `pg_cron` calling the `quartix-sync` function using `pg_net`
- **Deferred enrichment**: Every 60 seconds for speed limits and reverse geocoding
- Schedules automatically start/stop based on whether any devices are active

### Step 3: Add auto session cleanup
A database function that automatically ends sessions that have been idle for more than 30 minutes (no position updates), preventing the orphaned session problem.

### Step 4: Simplify the client (InstructorLiveSession)
- **Remove** `useGPSPoller` from the tracking page entirely
- **Remove** `useGPSAutoReconnect` (no longer needed)
- Keep only the existing **realtime subscription** to `gps_devices` table (already in place)
- The page becomes a pure display: subscribe to DB changes, render map
- Starting/stopping sessions just updates the database -- the server-side poller handles the rest

### Step 5: Add Quartix token caching
Create a `quartix_auth_cache` table to store the access token with an expiry timestamp. The sync function checks this first and only re-authenticates when the token has expired (~every 30 minutes instead of every 2 seconds).

## Technical Details

### New table: `quartix_auth_cache`
| Column | Type | Purpose |
|--------|------|---------|
| id | text (PK) | Always 'default' (single row) |
| access_token | text | Cached Quartix API token |
| expires_at | timestamptz | When to refresh |

### New table: `cron_sync_config`  
| Column | Type | Purpose |
|--------|------|---------|
| id | text (PK) | Config key |
| is_enabled | boolean | Master on/off switch |
| interval_seconds | int | Poll frequency |
| last_run_at | timestamptz | Monitoring |

### pg_cron schedule
```sql
SELECT cron.schedule(
  'quartix-position-sync',
  '15 seconds',
  $$ SELECT net.http_post(
    url := '<edge-function-url>/quartix-sync',
    headers := '{"Authorization": "Bearer <service-role-key>"}'
  ) $$
);
```

### Auto-cleanup function
```sql
-- Automatically end sessions idle for >30 minutes
CREATE FUNCTION auto_cleanup_stale_sessions() ...
  UPDATE lesson_telematics SET ended_at = now()
  WHERE ended_at IS NULL
    AND started_at < now() - interval '30 minutes'
    AND id NOT IN (
      SELECT current_session_id FROM gps_devices
      WHERE current_session_id IS NOT NULL
    );
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/quartix-sync/index.ts` | Create | New streamlined server-side poller |
| `src/pages/InstructorLiveSession.tsx` | Modify | Remove client polling, keep realtime only |
| `src/hooks/useGPSPoller.ts` | Remove | No longer needed |
| `src/hooks/useGPSAutoReconnect.ts` | Remove | No longer needed |
| Database migration | Create | Add token cache table, cron schedule, cleanup function |

## Benefits

- **Tracking never stops** -- runs server-side regardless of what the user does on their phone
- **Page refresh safe** -- the phone just re-subscribes to realtime updates, session continues
- **No auth dependency** -- tracking runs with service role key, not user's session
- **Fewer API calls** -- token cached for 30 mins, single poll every 15s (not per-client)
- **Auto-cleanup** -- stale sessions automatically ended after 30 min idle
- **Simpler client code** -- ~200 lines removed from InstructorLiveSession

