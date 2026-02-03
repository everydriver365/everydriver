
Goal
- Stop the mobile “tracking tile” / session header from flickering between “Live” and “Not connected/Offline”, and make the connectivity indicator reflect true device activity (not “we polled the server”).

What’s actually causing the flicker (based on code + logs)
1) The backend poller is overwriting last_seen_at even when there is no new GPS data
- In supabase/functions/gpsgate-poller/index.ts there are multiple “skip” branches that do:
  - update({ last_seen_at: new Date().toISOString() })
  - even when:
    - there are no tracks today
    - the latest track is not newer than last_gpsgate_track_time
    - the track has no valid lat/lon
- That makes last_seen_at bounce between “real GPS timestamp” and “poll timestamp”.
- The UI (home badge + /instructor/traccar) uses last_seen_at to decide “Live” vs “Offline”, so those artificial updates can flip the UI state.

2) The frontend is calling gpsgate-poller far more often than intended (feedback loop)
- Network logs show multiple gpsgate-poller POSTs in the same second.
- In src/hooks/useGPSPoller.ts:
  - poll() depends on onData/onError
  - InstructorTraccarSession passes an inline onError function, which changes every render
  - that changes poll, which restarts the effect, which immediately calls poll again
- If the page is re-rendering frequently (realtime updates, timers), this can repeatedly “re-arm” the poller and cause rapid backend calls, which then increases DB updates and UI churn.

3) The “connection gating” logic currently hinges on a single timestamp
- InstructorMobileHome uses useTraccarConnectionStatus (polls last_seen_at every 30s).
- InstructorTraccarSession computes isConnected directly from device.last_seen_at.
- If last_seen_at is being manipulated by polling rather than actual device activity, both screens will visibly oscillate.

Implementation plan (code changes)
A) Stabilize frontend polling so gpsgate-poller is invoked at the intended interval only
1. Update src/hooks/useGPSPoller.ts
- Make the interval lifecycle independent of callback identity changes:
  - Store onData and onError in refs (onDataRef/onErrorRef)
  - Update those refs in a small useEffect when callbacks change
  - Make poll() not depend on onData/onError (so poll is stable)
- Result: useEffect in useGPSPoller will only restart when enabled or intervalMs changes, not on every render.

2. Update src/pages/InstructorTraccarSession.tsx
- Ensure callbacks passed into useGPSPoller are stable:
  - Wrap onError in useCallback (or pass nothing if it’s just logging).
- Optional hardening:
  - Pause polling when document.visibilityState !== "visible" (reduces background churn on mobile).

B) Fix backend semantics: last_seen_at must mean “device last reported”, not “we checked”
3. Update supabase/functions/gpsgate-poller/index.ts
- Remove these “Still update last_seen_at to indicate we checked” writes:
  - When tracks are empty for today
  - When currentTrackTime <= last_gpsgate_track_time (duplicate/old point)
  - When lat/lon cannot be extracted
- Keep skipped++ counters and logs, but do not mutate last_seen_at in those paths.
- Outcome: UI will stop bouncing between a real timestamp and a synthetic “now”.

C) Add a proper fallback for “no tracks today” (stationary devices / midnight boundary)
4. Implement a “latest status” fallback in gpsgate-poller
- Problem: /tracks?Date=YYYY-MM-DD can return empty even though the device has a known last position (especially if it hasn’t moved today).
- Add a secondary call if tracks are empty OR the latest track is not newer:
  - Fetch a “latest status / last known position” endpoint (commonly exposed as a users status endpoint).
- Because we don’t yet have a confirmed response schema in our codebase, implement it defensively:
  - Log one sample payload (truncated) when available
  - Reuse the existing extractPosition/extractSpeed/extractTime helpers where possible (or add an equivalent extractor for the status response)
- Only update traccar_devices when we have a valid lat/lon, and set last_seen_at from the status timestamp (not “now”).

D) Reduce UI sensitivity to brief gaps (optional, but recommended)
5. Align connection thresholds across app surfaces
- Right now:
  - useGPSConnectionStatus marks “offline” after 120s
  - InstructorTraccarSession uses 300s when idle
- Update src/hooks/useGPSConnectionStatus.ts to use a 5-minute “connected” window for the home tile:
  - active < 30s
  - recent < 300s
  - offline otherwise
- This prevents “false offline” on hardware that reports intermittently.

Verification plan (how we’ll confirm it’s fixed)
1) Confirm frontend is no longer hammering gpsgate-poller
- Watch network requests: should be one call on mount + one per 15s/30s, not multiple per second.
- Console should stop showing repeated “[GPSPoller] Skipping - previous poll still running”.

2) Confirm last_seen_at stops “bouncing”
- Inspect the traccar_devices row:
  - last_seen_at should only move forward when there is a new device timestamp (track/status), not when a poll happens with no new data.
  - last_seen_at should generally match last_gpsgate_track_time (or the status timestamp), not “now” during skips.

3) End-to-end behavior on mobile
- Open the mobile home screen and /instructor/traccar:
  - The badge should remain stable (“Live” when there are recent updates, “Offline” when genuinely stale).
  - No rapid alternating between states.

Risks / edge cases handled
- If the “latest status” endpoint isn’t available in your GPSgate tenant or responds differently:
  - We will fail gracefully: no updates, no last_seen_at overwrite, no flicker.
  - We’ll keep logs to quickly adapt parsing once we see the response structure.
- If multiple clients are open (two tabs/phones):
  - Polling frequency will still be controlled per client, and the backend will no longer write “fake activity” timestamps that cause flipping.

Files we expect to change
- src/hooks/useGPSPoller.ts (stabilize polling, callback refs)
- src/pages/InstructorTraccarSession.tsx (stable callbacks; optional visibility pause)
- supabase/functions/gpsgate-poller/index.ts (do not write last_seen_at on skipped; add latest-status fallback)
- src/hooks/useGPSConnectionStatus.ts (optional: widen “recent” window for home tile stability)
