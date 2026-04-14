

## Fix: Radius Device Not Appearing in Dropdown

### Root Cause

Kenneth's Radius device "Charlotte" (`861778063583081`) is marked `is_active = false` in the database. The `DeviceSelectorDropdown` and the page's `fetchData` both filter with `.eq("is_active", true)`, so it's excluded from the list entirely.

### Fix

1. **Database update** — Set `is_active = true` on the Radius device for Kenneth:
   ```sql
   UPDATE gps_devices SET is_active = true WHERE id = '0cd172d5-d9a0-47bb-bbb6-cb30c686a8d4';
   ```

2. **No code changes needed** — the dropdown and provider logic already support multiple providers. Once the device is active, it will appear in the selector alongside the Geotab device.

### Files Changed
- None (database-only fix)

