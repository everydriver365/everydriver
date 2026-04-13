

## Plan: Migrate Radius Poller to Key Telematics Fleet API v2

### Problem
The current `radius-poller` edge function uses the legacy **Velocity Fleet API** (`velocityfleet.com`) with a fragile Django JWT refresh-token flow. The official Key Telematics Fleet API v2 (`api.uk1.kt1.io`) supports **static API keys** with no expiry, eliminating all token refresh complexity.

### Key Migration Benefits
- Eliminates token refresh logic and `radius_session_cache` table dependency
- Uses the documented, supported API instead of an undocumented legacy endpoint
- Simpler auth: single `x-api-key` header on every request
- UK-specific endpoint for lower latency: `https://api.uk1.kt1.io/fleet/v2`

---

### Step 1: Add New Secret — `KT_API_KEY`

Request a new Key Telematics API key from the user. This replaces `RADIUS_API_TOKEN` and `RADIUS_REFRESH_TOKEN`.

The user generates this in the Key Telematics dashboard under their user account > API Keys.

### Step 2: Rewrite `radius-poller` Edge Function

**File**: `supabase/functions/radius-poller/index.ts`

Changes:
- **Remove** the entire `authenticate()` function and `RadiusSession` interface
- **Remove** `cachedSession` state and DB cache logic
- **Replace** auth with a simple `x-api-key` header using `KT_API_KEY` secret
- **Replace** base URL from `velocityfleet.com` to `https://api.uk1.kt1.io/fleet/v2`
- **Replace** the live positions endpoint from the undocumented `POST /api/mobile/kinesis/device-live-positions/` to the official `GET /entities/assets?owner={ownerId}` endpoint (each asset includes last known position)
- **Update** response field mapping to match Key Telematics v2 asset schema (fields like `lastPosition.latitude`, `lastPosition.longitude`, `lastPosition.speed`, `lastPosition.heading`, `lastPosition.timestamp`)
- **Keep** all existing downstream logic: `gps_devices` updates, `telematics_gps_points` inserts, `live_pupil_positions` updates, distance calculations
- **Fall back** gracefully: still check for `RADIUS_API_TOKEN` + `RADIUS_REFRESH_TOKEN` as a legacy path if `KT_API_KEY` is not set, so existing setups keep working during transition

### Step 3: Verify & Map Response Fields

Since the full asset/telemetry response schema wasn't fully captured from the docs, I will:
1. Call the API with `curl_edge_functions` to inspect the actual response shape
2. Map fields correctly (lat, lng, speed, heading, ignition, timestamp, road/street)
3. Adjust unit conversions if needed (the v2 API may return km/h directly vs mph)

### Step 4: Clean Up (Optional)

- The `radius_session_cache` table can be deprecated (no longer needed with static API keys)
- `RADIUS_REFRESH_TOKEN` secret becomes unused with the new auth method

---

### Technical Details

**Authentication change:**
```
// Before (Velocity Fleet - complex)
POST velocityfleet.com/vapi/v1/accounts/users/oauth2/refresh/
Headers: API-Token, Content-Type
Body: { refresh, token }

// After (Key Telematics v2 - simple)
GET api.uk1.kt1.io/fleet/v2/entities/assets?owner={ownerId}
Headers: x-api-key: {KT_API_KEY}
```

**Rate limits to respect:**
- GET/List: 10 requests/second
- Auth: 5 requests/hour (not relevant with API keys)

**Files changed:**
| Action | File |
|--------|------|
| Modify | `supabase/functions/radius-poller/index.ts` |
| Secret | `KT_API_KEY` (new) |

