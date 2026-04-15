

# Stop Floating Tracking Bar from Auto-Appearing

## Problem
The `FloatingSessionBar` (showing "Tracking · LIVE · 3 min · 0 mph") appears on the homepage whenever the `gps_devices` table has a row with `is_active = true` and a `current_session_id` set. It doesn't verify whether the instructor manually started a tracking session — stale or auto-created data triggers it.

## What stays untouched
Weather alerts, driving alerts, and all other banners remain as-is.

## Changes

### 1. `src/hooks/useActiveSession.ts`
Add a stricter liveness check: only return an active session if `last_seen_at` is within the last **60 seconds** (not 5 minutes). This prevents stale device data from triggering the bar. The current 5-minute window is far too generous and causes the bar to appear long after any real activity.

Additionally, add a check that `current_session_id` corresponds to a `lesson_telematics` record whose `ended_at` is null — ensuring we only show truly in-progress sessions, not completed ones with stale device state.

### 2. `src/components/instructor/FloatingSessionBar.tsx`
No structural changes needed — it already conditionally renders based on `hasActiveSession`. The fix in the hook will prevent false positives.

### Result
The tracking bar will only appear when there is a genuinely active, recently-updated tracking session — not from stale GPS device records. Weather and other alerts remain unchanged.

