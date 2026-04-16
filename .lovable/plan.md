

## Plan: Fix "Insufficient GPS Data" After Ending a Track

### Problem
When a user manually starts a tracking session via "Start Track", the radius-poller can auto-end that session when the ignition turns off — clearing the `current_session_id` from the device. This means:
- The session gets auto-ended before the user presses "Stop"
- GPS points may not be written to the manually-created session
- The trip summary report then shows "insufficient GPS data"

Additionally, the `startSession` function never sets `manually_started = true`, so the poller treats manual sessions identically to auto-created ones.

### Fix (3 changes)

**1. `src/pages/InstructorLiveSession.tsx` — Set `manually_started: true`**
When creating a telematics session in `startSession`, add `manually_started: true` to the insert payload (line ~484).

**2. `supabase/functions/radius-poller/index.ts` — Don't auto-end manual sessions**
In the auto-end block (line ~617), before ending a session, check if it was `manually_started`. If so, skip auto-ending — only the user can stop a manually started session.

```
// Before auto-ending, check if session was manually started
const { data: sess } = await supabase
  .from("lesson_telematics")
  .select("manually_started")
  .eq("id", device.current_session_id)
  .single();

if (sess?.manually_started) {
  // Skip auto-end — user must stop this manually
  continue;
}
```

**3. `src/components/instructor/TripSummarySheet.tsx` — Add retry for report generation**
Add a short delay (3 seconds) before calling `generate-route-report` to allow the final poller cycle to write any pending GPS points. If the report returns insufficient data, retry once after 5 seconds.

### Files to modify
- `src/pages/InstructorLiveSession.tsx` — add `manually_started: true` to session insert
- `supabase/functions/radius-poller/index.ts` — guard auto-end against manually started sessions
- `src/components/instructor/TripSummarySheet.tsx` — add retry logic for report generation

