

## Plan: Fix session ending being immediately overridden by auto-create

### Root Cause
When the user presses "End" on the tracking page:
1. `stopSession` sets `ended_at` on the telematics session and clears `current_session_id` on the device
2. The client is calling `radius-poller` every 2 seconds (line 350-353)
3. The poller sees ignition ON + no `current_session_id` → auto-creates a new session immediately
4. The realtime subscription picks up the new `current_session_id` → UI shows session is still active

The session IS ending in the DB, but a new one is created within 2 seconds.

### Changes

**File: `supabase/functions/radius-poller/index.ts`**

Add a cooldown check before auto-creating sessions. Before creating a new session at line 592, query the most recent `lesson_telematics` for this device's instructor to see if one was ended in the last 60 seconds. If so, skip auto-creation (the instructor just manually ended a session).

```sql
-- Check: was a session for this instructor ended in the last 60s?
SELECT id FROM lesson_telematics 
WHERE instructor_id = device.instructor_id 
  AND ended_at > now() - interval '60 seconds'
LIMIT 1
```

If a recently-ended session exists, skip the auto-create.

**File: `src/pages/InstructorLiveSession.tsx`**

1. Stop triggering the poller immediately after ending a session. After `stopSession` clears `current_session_id` locally (line 756), the `useEffect` at line 262 re-runs and the `device?.current_session_id` check at line 347 is falsy, so the poller interval should not restart. However, there's a race: the poller call that's already in-flight can still auto-create a session. The server-side cooldown above handles this.

2. Additionally, stop the poller calls during the stop operation. Add the `isStopping` flag to the polling guard so no poller triggers fire while ending.

### Result
After pressing "End", the session ends cleanly. The poller won't auto-create a new session for 60 seconds, giving the UI time to settle. The pupil selector reappears.

