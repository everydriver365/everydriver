

## Plan: Fix Radius Export Stream Connection

### Problem
The `RADIUS_EXPORT_ENDPOINT` secret contains the label text from your original message (`admin.editors.exporttask.details.credentials.endpoint:https://...`) instead of just the URL. This causes the "Url scheme not supported" error. All three fallback methods (Export Stream, KT v2, Legacy) are failing.

### Fix

**Step 1: Update the corrupted secret**
- Update `RADIUS_EXPORT_ENDPOINT` to the correct value: `https://export.eu1.kt1.io/v2/stream`

**Step 2: Test the poller**
- Call the `radius-poller` edge function and verify it connects to the Export Stream without the "Url scheme not supported" error
- Check logs to confirm it reaches the API successfully

**Step 3: Verify Charlotte tracker status**
- Confirm the device appears as connected (or at least no longer errors) on your tracking page

### What stays the same
- No code changes needed — the `radius-poller` already has the correct logic
- `RADIUS_EXPORT_API_KEY` is fine as-is
- Device linkage to your account is already correct

