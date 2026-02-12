

## Geotab Dashcam Integration Plan

This plan adds real Geotab dashcam functionality to your platform, building on the existing Geotab tracking concept and connecting it to the dashcam pages already in your instructor portal.

---

### What This Delivers

Instructors with Geotab devices (that have camera add-ins) will be able to:
- View dashcam video clips linked to their lessons and trips
- Download incident footage triggered by G-force events
- See thumbnail previews of recorded clips in the fleet dashboard
- Access footage from the existing "Dashcam" menu item in the instructor portal

---

### Step 1: Database Schema Changes

Add Geotab-specific columns and a new dashcam media table:

| Change | Details |
|--------|---------|
| Add `geotab_device_id` to `gps_devices` | Links Geotab device serial to our tracking system |
| Create `dashcam_media` table | Stores media file metadata (video/image), timestamps, device link, lesson link, thumbnail URLs, Geotab media file ID |

The `dashcam_media` table will include:
- `id`, `instructor_id`, `device_id` (FK to gps_devices), `lesson_telematics_id` (optional FK)
- `geotab_media_file_id` (the Geotab MediaFile ID)
- `media_type` (video/image), `file_name`, `duration_seconds`
- `thumbnail_url`, `latitude`, `longitude`, `recorded_at`
- `is_incident` (flagged by G-sensor), `status` (pending/available/expired)
- RLS policies restricting access to the owning instructor

---

### Step 2: Geotab API Secrets

You'll need to provide Geotab API credentials. Required secrets:
- `GEOTAB_DATABASE` -- your Geotab database name
- `GEOTAB_USERNAME` -- API username  
- `GEOTAB_PASSWORD` -- API password

These will be stored securely and used only by backend functions.

---

### Step 3: Backend Function -- `geotab-poller`

A new backend function that:
1. Authenticates with the Geotab API (session-based auth with caching)
2. Fetches device status data (GPS, speed, ignition) for linked Geotab devices
3. Fetches new MediaFile entries (dashcam clips) since last sync
4. Stores media metadata in `dashcam_media` table
5. Updates `gps_devices` with latest position data

This will be triggered by `pg_cron` every 15 seconds for position data, and every 60 seconds for media file checks.

---

### Step 4: Backend Function -- `geotab-media-download`

A separate function for on-demand video retrieval:
- Called when an instructor clicks to view/download a clip
- Proxies the `DownloadMediaFile` Geotab API call
- Streams the video back or generates a temporary signed URL
- Respects Geotab rate limits (240 downloads/minute)

---

### Step 5: Instructor Portal -- Dashcam Tab

Replace the current marketing-only dashcam page with a functional dashcam viewer within the instructor portal:

- **Media Gallery**: Grid of video thumbnails sorted by date, filterable by vehicle
- **Video Player**: In-app playback with map overlay showing where the clip was recorded
- **Incident Clips**: Highlighted section for G-force triggered recordings
- **Lesson Linking**: Auto-associate clips with lessons based on timestamp overlap
- **Download Button**: Direct download of original footage

This will be accessible from the existing "Dashcam" menu item in the instructor portal.

---

### Step 6: Admin Panel -- Geotab Device Linking

Extend the existing admin instructor form to allow linking Geotab device IDs (similar to how Quartix Vehicle/Driver IDs are linked today):
- Add `geotab_device_id` field to the instructor admin form
- Admin can paste the Geotab serial number to link a device

---

### Technical Notes

- The Geotab API uses session-based authentication (not API keys), requiring `Authenticate` then using the returned session ID and server URL for subsequent calls
- MediaFile entities support `GetFeed` for incremental polling (only fetching new files since last check)
- Video files are MP4 format, images are JPEG -- both natively supported by browsers
- Rate limits: 350 Get requests/min, 240 download requests/min -- well within our polling frequency
- The existing `tracking_provider` column in `gps_devices` will be set to `'geotab'` for Geotab-linked devices

