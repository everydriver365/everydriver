

## Enhance Geotab Integration: Full Dashcam Metadata + Faster Live Map

### 1. Database Schema Changes

Add new columns to `dashcam_media` to capture all available Geotab MediaFile metadata:

| Column | Type | Purpose |
|--------|------|---------|
| `driver_id` | text | Geotab driver ID |
| `driver_name` | text | Driver name from Geotab |
| `event_tags` | text[] | Event tags (HarshBraking, Speeding, Incident, etc.) |
| `g_force` | numeric | Peak G-force value for the event |
| `camera_angle` | text | Camera position (front, rear, cabin) |
| `resolution` | text | Video resolution |
| `file_size_bytes` | bigint | File size |
| `processing_status` | text | Geotab processing state |
| `speed_at_event_kmh` | numeric | Vehicle speed when media was captured |
| `road_name` | text | Road name at capture location |

Also add `last_heading` update to `gps_devices` (already exists in schema) and `last_ignition_status` from Geotab DeviceStatusInfo.

### 2. Geotab Poller Enhancement

Update `supabase/functions/geotab-poller/index.ts` to:

- **Capture heading and ignition** from DeviceStatusInfo (fields: `bearing`, `isDeviceCommunicating`)
- **Enrich media metadata** with driver info (via `Get` on `Driver` type), event tags, G-force, camera angle, resolution, file size, speed, and processing status from MediaFile properties
- **Use Geotab `GetFeed` for DeviceStatusInfo** instead of `Get` for more efficient incremental updates

### 3. Add Geotab Cron Job (Every 10 Seconds)

Create a `pg_cron` job to call `geotab-poller` every 10 seconds (faster than the current 15-second Quartix interval) for near-real-time live map updates:

```text
Schedule: '10 seconds'
Target:   geotab-poller edge function
```

### 4. Faster Client-Side Refresh

Reduce client polling intervals for snappier live map updates:

- `useLivePupilPositions`: Keep at 2s (already fast)
- `useGPSPoller`: Reduce default from 5s to 3s
- `LivePupilsDashboard`: Reduce from 3s to 2s
- Stale threshold: Reduce from 3 minutes to 60 seconds for quicker "offline" detection

### 5. Summary of Changes

| Area | Change |
|------|--------|
| Database | Add ~10 columns to `dashcam_media` for full metadata |
| Edge function | Enrich `geotab-poller` with heading, ignition, driver info, event tags, G-force |
| Cron | New `pg_cron` job every 10 seconds for geotab-poller |
| Client hooks | Tighten polling intervals and stale thresholds |

No new edge functions needed. No UI changes required -- the existing dashcam gallery and live map components will automatically display the richer data.

