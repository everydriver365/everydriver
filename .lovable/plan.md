

## Diagnosis: Stale Browser Cache

Martin B **does** have full availability — all 7 days, 09:00–17:00, with zero lessons booked.

The code in `SelfBookingCalendar.tsx` is correct and queries `instructor_working_hours` (which returns 7 active rows). However, the network logs show a request to the non-existent `instructor_availability` table (404), which means the browser is running a **stale cached version** of the code from before the fix.

### Fix

1. **Force a hard refresh** of the preview to pick up the latest build (the code is already correct)
2. If the stale request persists, add a cache-busting mechanism or clear service worker cache (the project uses `vite-plugin-pwa`)

### No code changes needed
The `SelfBookingCalendar.tsx` already:
- Queries `instructor_working_hours` correctly (line 111)
- Falls back to default settings when `instructor_booking_settings` has no rows (line 219)
- Generates hourly slots from 09:00–17:00 for each available day (lines 241–261)
- Filters by min notice (2h default) and max advance (56 days default)

Try doing a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) in the preview to clear the cached build.

