
# Switch from Traccar to GPSgate

## Overview
This plan migrates the GPS tracking system from Traccar to GPSgate Cloud. The current Traccar integration includes device registration, real-time position polling, telemetry processing, and vehicle health monitoring. GPSgate offers similar capabilities through their REST API.

## Scope of Changes

### Database Updates
The existing `traccar_devices` table and related tables will need minor modifications:
- Rename internal references from "traccar" to be more generic (e.g., "gps_devices")
- Add new columns for GPSgate-specific identifiers (application ID, device internal ID)
- Keep all existing telemetry tables unchanged (they store processed data, not raw API data)

### New Secrets Required
GPSgate Cloud authentication requires:
| Secret Name | Purpose |
|-------------|---------|
| `GPSGATE_SERVER_URL` | GPSgate Cloud server URL (e.g., `https://yourcompany.gpsgate.com`) |
| `GPSGATE_APP_ID` | Application ID from your GPSgate account |
| `GPSGATE_API_TOKEN` | API token or username/password for authentication |

### Edge Functions to Modify

**1. `traccar-poller` → `gpsgate-poller` (Rewrite)**
- **Current**: Polls Traccar `/api/positions` and `/api/devices` endpoints with Basic Auth
- **New**: Polls GPSgate REST API v1 endpoints with Bearer token auth
- GPSgate API endpoints:
  - `GET /api/v.1/applications/{appId}/devices` - List devices
  - `GET /api/v.1/applications/{appId}/devices/{deviceId}/positions` - Get positions

**2. `traccar-webhook` → `gpsgate-webhook` (Rewrite)**
- **Current**: Receives OsmAnd protocol data from Traccar Client app
- **New**: GPSgate uses different protocols; may need webhook for push notifications or continue with polling
- Note: GPSgate primarily uses polling rather than webhooks for position data

### Frontend Components to Update
| Component | Changes |
|-----------|---------|
| `InstructorTraccarSetup.tsx` | Rename to `InstructorGPSSetup.tsx`, update device registration UI |
| `TraccarConnectionChecklist.tsx` | Update branding and setup instructions |
| All route references `/instructor/traccar` | Change to `/instructor/gps-tracking` |
| Hooks: `useTraccarConnectionStatus`, `useTraccarPoller` | Rename and update API references |
| UI text referencing "Traccar" or "ST-902L" | Update to GPSgate-compatible device names |

### Hooks to Rename/Update
- `useTraccarConnectionStatus.ts` → `useGPSConnectionStatus.ts`
- `useTraccarPoller.ts` → `useGPSPoller.ts`
- Update all imports across the codebase

## Technical Details

### GPSgate API Authentication
```text
Authorization: Bearer {GPSGATE_API_TOKEN}
```

### GPSgate Response Format (Positions)
```text
{
  "devices": [{
    "id": 123,
    "name": "Vehicle 1",
    "position": {
      "latitude": 51.5074,
      "longitude": -0.1278,
      "speed": 45,
      "heading": 180,
      "timestamp": "2026-02-03T10:00:00Z"
    }
  }]
}
```

### Data Mapping
| Traccar Field | GPSgate Equivalent |
|---------------|-------------------|
| `uniqueId` (IMEI) | `device.identifier` |
| `position.speed` (knots) | `position.speed` (km/h - no conversion needed) |
| `position.course` | `position.heading` |
| `attributes.ignition` | `position.ignition` (if available) |
| `attributes.battery` | `position.battery` (if available) |

## Implementation Steps

### Phase 1: Backend Preparation
1. Add GPSgate secrets (`GPSGATE_SERVER_URL`, `GPSGATE_APP_ID`, `GPSGATE_API_TOKEN`)
2. Create new `gpsgate-poller` edge function with GPSgate API integration
3. Update database columns to support GPSgate device identifiers
4. Test edge function with your GPSgate account

### Phase 2: Frontend Migration
1. Rename all Traccar-related components and hooks
2. Update setup instructions for GPSgate device configuration
3. Update route paths from `/traccar` to `/gps-tracking`
4. Remove Traccar-specific branding (ST-902L references, Traccar Client app mentions)

### Phase 3: Cleanup
1. Delete old `traccar-poller` and `traccar-webhook` edge functions
2. Remove old Traccar secrets (`TRACCAR_SERVER_URL`, `TRACCAR_EMAIL`, `TRACCAR_PASSWORD`)
3. Run database migration to rename columns/tables

## Impact Assessment
- **Breaking Change**: Existing Traccar device registrations will need to be re-registered with GPSgate device IDs
- **Data Continuity**: Historical telemetry data (GPS points, alerts, ignition events) will be preserved
- **Downtime**: Minimal - can run both systems in parallel during migration

## Questions to Consider
- Do your GPSgate devices use the same IMEI identifiers currently stored in the database?
- Does your GPSgate account have the REST API enabled?
- Are there specific GPSgate features (geofences, events) you want to integrate?
