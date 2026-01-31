
# Traccar Server Polling Integration

## Overview

This plan creates a new edge function that polls your Traccar server's API to fetch position data and syncs it into the EveryDriver system. This allows you to keep using your existing Traccar server (`xaqkkucw4.traccar.com`) while automatically flowing data into the app.

## How It Will Work

```text
+-------------------+       +----------------------+       +-------------------+
|  ST-902L Tracker  | ----> |  Your Traccar Server | <---- |  traccar-poller   |
|  (OBD-II device)  |       |  xaqkkucw4.traccar   |       |  (Edge Function)  |
+-------------------+       +----------------------+       +-------------------+
                                                                    |
                                                                    v
                                                           +-------------------+
                                                           |  EveryDriver App  |
                                                           |  (Live Map, etc.) |
                                                           +-------------------+
```

The poller runs every 10 seconds (triggered via an external scheduler or called periodically), fetches the latest positions from your Traccar server, maps them to registered devices, and processes the data using the existing telemetry pipeline.

---

## Technical Implementation

### Step 1: Add Required Secrets

Two new secrets need to be configured:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `TRACCAR_EMAIL` | `info@everydriver.co.uk` | Your Traccar server login |
| `TRACCAR_PASSWORD` | `(your password)` | Your Traccar server password |
| `TRACCAR_SERVER_URL` | `https://xaqkkucw4.traccar.com` | Your Traccar server URL |

### Step 2: Create the `traccar-poller` Edge Function

A new function at `supabase/functions/traccar-poller/index.ts` will:

1. **Authenticate** with your Traccar server using Basic Auth
2. **Fetch latest positions** from `/api/positions` endpoint
3. **Fetch device list** from `/api/devices` to map `deviceId` → `uniqueId`
4. **Match devices** to registered `traccar_devices` by `uniqueId`
5. **Process each position** using the same logic as the webhook:
   - Update device state (`last_speed_kmh`, `last_latitude`, etc.)
   - Fetch road info (speed limits via OSM, road names via Mapbox)
   - Calculate acceleration/braking events
   - Insert GPS points into `telematics_gps_points`
   - Create alerts for speeding, harsh braking, harsh acceleration
   - Update live position for real-time tracking

### Step 3: Device Mapping Logic

The Traccar API returns positions with a numeric `deviceId`, but our system uses `uniqueId` (the tracker's IMEI/identifier). The poller will:

1. First fetch `/api/devices` to get the mapping:
   ```json
   [{"id": 3, "uniqueId": "7018524391", "name": "ST-902L", ...}]
   ```

2. Build a lookup map: `deviceId → uniqueId`

3. For each position, convert `position.deviceId` to `uniqueId` and match against `traccar_devices.device_identifier`

### Step 4: State Management for Acceleration Detection

To calculate braking/acceleration, we need the previous speed. The poller will:

1. Read `last_speed_kmh` and `last_seen_at` from the `traccar_devices` table
2. Calculate rate of change (m/s²) between old and new speed
3. Generate alerts for harsh events (same thresholds as current webhook)

### Step 5: Duplicate Position Prevention

To avoid processing the same position twice:

1. Track `last_position_id` per device in `traccar_devices` table (new column)
2. Only process positions with `position.id > last_position_id`
3. Or compare `fixTime` timestamps to skip already-processed data

### Step 6: Invocation Strategy

The function can be triggered:

**Option A - HTTP Polling (Recommended for now)**
- Call the function every 10 seconds from a frontend timer when session is active
- Simple, works immediately

**Option B - External Cron (Production)**
- Use a service like cron-job.org to call the endpoint every 10 seconds
- Runs even when no browser is open

---

## Database Changes

A small migration to track the last processed position:

```sql
ALTER TABLE traccar_devices 
ADD COLUMN IF NOT EXISTS last_traccar_position_id BIGINT;
```

---

## Edge Function Code Structure

```typescript
// supabase/functions/traccar-poller/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Authenticate with Traccar
  const TRACCAR_URL = Deno.env.get("TRACCAR_SERVER_URL");
  const auth = btoa(`${email}:${password}`);
  
  // 2. Fetch devices to build uniqueId mapping
  const devicesRes = await fetch(`${TRACCAR_URL}/api/devices`, { 
    headers: { "Authorization": `Basic ${auth}` } 
  });
  const devices = await devicesRes.json();
  const deviceMap = new Map(devices.map(d => [d.id, d.uniqueId]));
  
  // 3. Fetch latest positions
  const positionsRes = await fetch(`${TRACCAR_URL}/api/positions`, {
    headers: { "Authorization": `Basic ${auth}` }
  });
  const positions = await positionsRes.json();
  
  // 4. Process each position
  for (const pos of positions) {
    const uniqueId = deviceMap.get(pos.deviceId);
    // Match to traccar_devices, calculate speed delta, 
    // insert GPS point, create alerts, update live position...
  }
  
  return new Response(JSON.stringify({ processed: positions.length }));
});
```

---

## Key Differences from Your Original Code

| Your Code | Improved Version |
|-----------|------------------|
| Uses `globalThis.supabase` | Uses proper Supabase client with service key |
| Inserts to `trips` table | Uses existing `telematics_gps_points` table |
| In-memory speed tracking | Uses `traccar_devices` table for state |
| No device mapping | Maps Traccar `deviceId` → `uniqueId` |
| Fixed overspeed limit | Uses dynamic speed limits from OSM API |
| No session awareness | Only processes when `current_session_id` is set |

---

## Benefits of This Approach

1. **Keep your Traccar server** - No need to reconfigure the ST-902L tracker
2. **Automatic sync** - Data flows from Traccar to EveryDriver seamlessly
3. **All existing features work** - Live map, speed limits, alerts, saved routes
4. **Backup data** - Your Traccar server keeps a copy of all positions
5. **Future scalability** - Can add more devices without SMS configuration

---

## Implementation Steps

1. Add the three secrets (TRACCAR_EMAIL, TRACCAR_PASSWORD, TRACCAR_SERVER_URL)
2. Add the database column for position tracking
3. Create the `traccar-poller` edge function
4. Test by calling it manually
5. Add periodic polling from the session page when active

