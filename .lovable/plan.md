# Fix: Speed limit never changes on Tracking

## Root cause

In `src/pages/InstructorLiveSession.tsx`, when Phone Tracker is the active provider, the speed-limit number rendered on the panel comes from a React state value (`speedLimitKmh`) that is **only updated by Supabase subscriptions** to `live_pupil_positions` and `lesson_telematics`.

That state is never updated from the actual GPS fix the phone is producing. The streamer (`usePhoneTrackingStreamer`) already resolves the per-fix limit and exposes it on every `onPosition` callback as `fix.speedLimitKmh`, but `InstructorLiveSession`'s `onPosition` handler ignores that field — it only stores `lastPhoneFix` and the trail.

Consequences:
- If no pupil is selected, no row is written to `live_pupil_positions`, so the subscription never fires and `speedLimitKmh` stays at whatever the very first DB value was (often the device's stale `last_speed_limit_kmh`, hence "always the same").
- Even with a pupil, the panel updates lag the actual road because we wait for a DB round-trip + realtime push instead of using the value already computed locally.

## Fix

Single, small change in `src/pages/InstructorLiveSession.tsx`:

In the `usePhoneTrackingStreamer({ ..., onPosition })` handler (around line 240), also call `setSpeedLimitIfValid(fix.speedLimitKmh)` so the locally resolved limit immediately drives the UI. The existing `setSpeedLimitIfValid` guard (16–113 km/h) protects against bogus values.

Also clear `speedLimitKmh` when leaving phone provider / switching session so a stale value can't linger (mirrors the existing `resolvedRoadName` reset).

## Why this is enough

- `usePhoneTrackingStreamer` already awaits `resolvePhoneSpeedLimit` whenever the device has moved >60 m or 20 s have passed and updates `cachedLimitRef`, then includes that value on every `onPosition` fix.
- `phoneSpeedLimit.ts` resolves via local IndexedDB grid cache (~11 m) → `resolve-speed-limit` edge function (Overpass + UK defaults).
- After this change, the limit on screen will refresh as soon as a new GPS fix arrives with a different cached/looked-up value, with no dependency on a pupil being selected or on realtime DB subscriptions.

No DB or edge-function changes are required.
