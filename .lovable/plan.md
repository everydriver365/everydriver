

## Plan: Fix Tracking Active Indicator

### Problem
The bottom nav's tracking indicator (`isTrackingActive`) checks if any GPS device has a `current_session_id` set. However, the Radius poller automatically creates telematics sessions whenever the device sends data — so the indicator shows "active" even when the instructor hasn't pressed "Start Track". The `useActiveSession` hook correctly filters by `manually_started = true`, but the bottom nav does not.

### Fix
**File: `src/components/instructor/InstructorBottomNav.tsx`** — Update the `checkActiveSession` function to also verify that the linked `lesson_telematics` record has `manually_started = true` and `ended_at` is null.

Instead of just checking `current_session_id IS NOT NULL` on `gps_devices`, query `lesson_telematics` directly:

```sql
-- Current (wrong): just checks gps_devices.current_session_id
-- Fixed: check lesson_telematics where manually_started = true AND ended_at IS NULL
```

The query will:
1. Get `gps_devices` for the instructor with a non-null `current_session_id`
2. Then check the linked `lesson_telematics` row has `manually_started = true` and `ended_at IS NULL`

This aligns the bottom nav indicator with the same logic used in `useActiveSession`.

### Files to modify
- `src/components/instructor/InstructorBottomNav.tsx` — update `checkActiveSession` query

