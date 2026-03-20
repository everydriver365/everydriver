

# Plan: Add Real-Time Impact Detection with Push Notifications to Geotab Poller

## Current State

- **`geotab_impact_events` table** — exists, stores high G-force events
- **`geotab-behaviour-sync` edge function** — inserts impact events when G-force > 1.5g, but only runs on manual sync (not real-time)
- **`geotab-poller` edge function** — runs every ~10s for live tracking, fetches DeviceStatusInfo, speed limits, diagnostics, faults, and media — but does NOT check for ExceptionEvents or send push notifications
- **`send-push-notification` edge function** — exists and works for both web push and Expo
- **`GeotabImpactTab` UI** — exists with acknowledge flow

## What's Missing

The poller doesn't monitor for high G-force events in real-time and doesn't send push notifications when impacts are detected.

## Changes

### 1. `supabase/functions/geotab-poller/index.ts` — Add ExceptionEvent batch call + push notification

Add to the existing batched `geotabMultiCall`:
- One additional `Get` call for `ExceptionEvent` with `fromDate` set to 2 minutes ago, filtered to accelerometer-related built-in rules
- After processing positions, loop through exception results and:
  - Calculate G-force from the event data
  - If G-force > 2.0g (critical) or > 1.5g (high), upsert into `geotab_impact_events`
  - For critical events (> 2.0g), immediately call the `send-push-notification` edge function with:
    - Title: "Impact Alert"
    - Body: "{g_force}g impact detected at {speed} mph near {road_name}"
    - Data: `{ url: "/instructor/geotab", type: "impact_alert", eventId }`
    - `requireInteraction: true` so the notification stays visible
  - Use `geotab_event_id` unique constraint to prevent duplicate inserts and duplicate notifications

### 2. No other files change

The impact tab UI, hooks, and database table already exist and will automatically show new events inserted by the poller.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/geotab-poller/index.ts` | Add ExceptionEvent to batch call, insert impacts, send push notifications |

