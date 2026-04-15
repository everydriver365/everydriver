

# Stop Tracking Bar from Auto-Appearing

## Root Cause
The `radius-poller` edge function automatically creates `lesson_telematics` sessions whenever it detects the vehicle ignition is ON. The `FloatingSessionBar` then picks up this session because the GPS device data is genuinely live (within 60 seconds). This is why the bar keeps popping up without pressing "Start Track."

## Solution
Add a `manually_started` boolean flag to `lesson_telematics`. The `FloatingSessionBar` will only show sessions where this flag is `true`. Auto-created sessions from the poller will default to `false` and continue recording GPS data silently in the background.

## Changes

### 1. Database Migration
Add column `manually_started` (boolean, default `false`) to `lesson_telematics`.

### 2. `src/hooks/useActiveSession.ts`
Add `.eq("manually_started", true)` to the `lesson_telematics` query so the floating bar only appears for sessions the instructor explicitly started.

### 3. `src/components/instructor/LovableTracker.tsx`
When the instructor presses "Start Tracking," update the current `lesson_telematics` record to set `manually_started = true` (or create one with that flag if none exists).

### What stays untouched
- Weather alerts, driving alerts, all other banners
- The `radius-poller` continues auto-creating sessions for background GPS logging
- The GPS device data flow is unchanged

