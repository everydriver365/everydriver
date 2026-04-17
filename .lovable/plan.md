

## Investigate Radius/Kinesis Dashcam API for In-App Gallery

### What I checked

- Project already has `RADIUS_API_TOKEN`, `RADIUS_USERNAME`, `RADIUS_PASSWORD`, `RADIUS_CUSTOMER_ID`, `RADIUS_EXPORT_API_KEY`, `RADIUS_EXPORT_ENDPOINT`, `RADIUS_REFRESH_TOKEN` configured.
- Existing telematics integration uses Radius V2 Export Stream via `radius-poller` (per memory `mem://infrastructure/telemetry-integration-and-performance`).
- Current dashcam UX is a deep link to `kinesisfleetpro.com` — no API integration yet.

### What I found about the Kinesis/Radius dashcam API

Public/known facts:
- Kinesis Fleet Pro is built on **SureCam / Radius Telematics** dashcam hardware (4G connected cameras).
- Radius exposes a **Kinesis API** (sometimes called "Kinesis Connect" or "SureCam API") that includes:
  - Vehicle/device list
  - Trip events (harsh braking, speeding, collisions)
  - **Video clip endpoints** — typically `/videos`, `/clips`, `/events/{id}/video` returning signed URLs to MP4 files hosted on their CDN
  - **Live view / snapshot** requests (on-demand pull from camera, costs cellular data)
- **The API is not publicly documented.** Access requires a written request to your Radius account manager who issues:
  - API base URL (separate from the Export Stream)
  - OAuth client ID + secret OR a long-lived API key scoped to your customer ID
  - Permission flag enabling the `video.read` scope on your account

### Verification plan (once approved, in default mode)

1. **Probe known endpoints** with existing `RADIUS_*` credentials via a one-off edge function:
   - `GET {RADIUS_EXPORT_ENDPOINT}/videos?customerId={RADIUS_CUSTOMER_ID}`
   - `GET .../events?hasVideo=true`
   - `GET .../devices/{deviceId}/clips`
   - Test with bearer token + with `X-Api-Key` header.
2. If 404/401 → credentials don't include video scope. Draft an email template the user can send to their Radius account manager requesting:
   - Kinesis Video API access
   - `video.read` scope
   - API base URL + auth method
3. If 200 → document the response shape and proceed to build the gallery.

### Build plan (if API access confirmed)

**Backend** (`supabase/functions/radius-dashcam/index.ts`)
- `GET ?action=list&from=&to=&pupilId=` — list video clips for the instructor's vehicles, optionally joined to `lesson_telematics` by timestamp/vehicle to attach pupil names.
- `GET ?action=stream&clipId=` — proxy the signed CDN URL (or return it directly if CORS allows).
- Auth: validate JWT, resolve instructor via `get_instructor_id_for_user`, only return clips for vehicles in `gps_devices` belonging to that instructor.

**Frontend** (replace `DashcamGalleryView.tsx`)
- iOS-styled grid of clip thumbnails (date, duration, trigger event, pupil name if matched).
- Filter chips: All / Harsh brake / Speeding / Collision / Manual.
- Tap → fullscreen `<video>` player with download/share button.
- Empty state and "Open Radius portal" fallback link kept for clips not yet synced.

**DB** (optional cache table to avoid re-hitting API)
- `dashcam_clips` (id, instructor_id, device_id, clip_id, recorded_at, duration_s, trigger_type, signed_url, signed_url_expires_at, pupil_id nullable) with RLS scoped via `get_instructor_id_for_user`.

### Risks / unknowns

- **API may not exist for self-serve** — Radius historically gates dashcam endpoints behind a commercial agreement. If so, deliverable becomes the email template + an in-app "Request Dashcam API" admin tile, not a working gallery.
- **Video URLs likely require signed/short-lived tokens** — must proxy via edge function rather than embedding raw CDN URL in the client.
- **Bandwidth costs** — pulling clips on demand from the camera (vs already-uploaded events) bills the customer's data plan.

### Files that would change

- New: `supabase/functions/radius-dashcam/index.ts`
- New (optional): migration for `dashcam_clips` cache table
- Edit: `src/components/instructor/dashcam/DashcamGalleryView.tsx` (replace stub with real gallery)
- Edit: `src/components/instructor/HomeQuickActions.tsx` (route Dashcam tile to in-app page instead of external link)
- Keep: external link as fallback for unsupported clips

### Decision point

Before building, I need to **probe the API with your existing credentials** to see whether video endpoints respond. That probe is a single edge function call — fast and non-destructive. If it returns data, we build the gallery. If it 401s/404s, you'll need to email Radius for API access first and I'll draft that email.

