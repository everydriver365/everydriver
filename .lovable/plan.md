## Problem

When tracking a lesson with the phone (Phone Tracker provider), the Trip Summary shows 0.0 mi distance, no speed limits, and no actual speed graph. With Radius hardware it works fine.

## Root Cause

In `src/pages/InstructorLiveSession.tsx` (lines 232–247), `usePhoneTrackingStreamer` is called **without** the `sessionId` prop:

```ts
usePhoneTrackingStreamer({
  provider: ...,
  pupilId: selectedPupilId || null,
  onPosition: (fix) => { ... },
});
```

Inside the hook (`src/hooks/usePhoneTrackingStreamer.ts`), `sessionId` defaults to `null`. The block that persists each GPS fix into `telematics_gps_points` (via the `record_phone_gps_point` RPC) is gated by `if (sessionId)` — so it never runs. As a result:

- `telematics_gps_points` rows are never written for phone sessions
- The `generate-route-report` edge function reads from that table, so distance, average/max speed, speed limits and the Speed-Over-Time graph all come back empty
- Live position is still updated (different RPC), which is why the live map works during the lesson but the summary is empty afterwards

## Fix

Pass the active telematics session id (`device?.current_session_id`) to the streamer so phone fixes get persisted just like hardware fixes.

### File: `src/pages/InstructorLiveSession.tsx`

Update the `usePhoneTrackingStreamer` call (around line 232) to include:

```ts
sessionId: device?.current_session_id ?? null,
```

That single change makes `record_phone_gps_point` fire on every accepted fix, populating `telematics_gps_points` with latitude/longitude, speed_kmh, speed_limit_kmh and incremental distance — exactly what the Trip Summary needs.

## Verification

After the fix, on TestFlight:
1. Start a lesson with Phone Tracker selected
2. Drive (or walk) for a few minutes
3. Stop the session
4. Trip Summary should show non-zero distance, a real Speed Over Time graph with limit line, avg/max speed values, and roads travelled with speed limits
