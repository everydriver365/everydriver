## Goal

When the Google service-account private key is malformed/expired/rotated, surface it loudly in the admin Google Sync dashboard instead of silently piling up failed `calendar_sync_queue` rows.

## What to build

1. **Detect credential-class failures** in the sync queue
   - Classify `last_error` strings into two buckets:
     - **Credential broken** — matches `GOOGLE_PRIVATE_KEY`, `malformed`, `Failed to decode base64`, `invalid_grant`, `unauthorized_client`, `PEM`, `JWT`
     - **Transient** — everything else (network, 5xx, rate limit)
   - Add a SQL view `v_google_sync_credential_health` that returns:
     - `failed_count_last_24h`
     - `credential_error_count_last_24h`
     - `latest_credential_error` (text + timestamp)
     - `is_credential_broken` (boolean: true if ≥3 credential errors in last hour with no successes)

2. **Admin banner in `AdminGoogleSyncDashboard` / `GoogleSyncAlertsPanel`**
   - Red sticky banner at top when `is_credential_broken = true`:
     - Title: "Google Calendar credential broken"
     - Body: "The service-account private key is malformed or rejected by Google. No instructor calendars can sync until it's re-pasted."
     - Shows latest error message + timestamp + failed-lesson count
     - Button: "How to fix" → opens a small modal with step-by-step (download fresh JSON key from GCP → paste full JSON into `GOOGLE_PRIVATE_KEY` secret → click Retry All)
     - Button: "Retry all failed" → calls existing retry edge function once key is fixed

3. **Per-instructor tile state in the instructor portal**
   - The red "Tap to retry" Google Calendar tile currently loops forever on credential errors.
   - When the latest queue error for that instructor matches the credential pattern, show "Calendar credential issue — contact support" (grey, non-tappable) instead of red retry.
   - Keep red "Tap to retry" only for transient errors.

4. **Optional: lightweight alert log**
   - Insert one row into existing `admin_alerts` table (if present) per credential-broken transition, so it shows up in the admin notifications feed. Skip if no such table exists.

## Files to touch

- New migration: SQL view `v_google_sync_credential_health` + helper function `public.classify_sync_error(text)`
- `src/components/admin/GoogleSyncAlertsPanel.tsx` (or `AdminGoogleSyncDashboard.tsx`) — add banner
- New `src/components/admin/CredentialBrokenBanner.tsx`
- Instructor calendar sync tile component (need to locate during build) — branch on error class
- No edge function changes — `last_error` is already populated

## Out of scope

- Auto-rotating the key (can't be done from app code)
- Email/SMS notifications (can be a follow-up)
- Any change to the sync edge function itself