## Goal

When the instructor picks **Phone GPS** on `/instructor/tracking`, the mini map should appear straight away with the device's current position — without requiring them to first tap *Start phone tracking* or select a pupil.

## Root cause

In `src/pages/InstructorLiveSession.tsx` the map's coordinates come from either:
- `useLivePupilPosition` (only subscribes when a pupil id is present), or
- `lastPhoneFix` from `usePhoneTrackingStreamer` (only runs after permission granted **and** the user pressed *Start phone tracking*).

Until both gates pass, `mapLatitude/mapLongitude` are `null`, and `MiniLiveMap` covers the Google Map div with a "No position data yet" overlay.

`PhoneLastLocationCard` is also hidden (`if (!active) return null`) until streaming is confirmed, so there's no sparkline either.

## Changes

1. **One-shot location preview** — in `InstructorLiveSession.tsx`, when `isPhoneProvider && locationPermissionStatus === "granted"` but `phoneStreamingConfirmed === false`, call `navigator.geolocation.getCurrentPosition` once and store the result into `lastPhoneFix`. This gives `MiniLiveMap` an initial centre/marker as soon as the user picks Phone GPS.
   - Re-run when permission flips from `prompt → granted`.
   - Cancel/ignore if the user later starts the full streamer (which then takes over).

2. **MiniLiveMap empty state** — in `src/components/instructor/tracking/MiniLiveMap.tsx`, soften the overlay shown when `!hasPosition`:
   - Drop the opaque `bg-muted/80` cover and replace with a small badge in the corner ("Waiting for GPS…") so the Google base map is still visible (centred on the UK fallback or last known instructor area).
   - When phone provider is active and permission isn't granted yet, show a clearer "Allow location to see your position" hint.

3. **PhoneLastLocationCard visibility** — change `active` gating so the card renders whenever `isPhoneProvider && locationPermissionStatus === "granted"`, not only after *Start phone tracking*. The "Last location" row will show the one-shot fix; the sparkline keeps its existing "Waiting for movement…" placeholder until 2+ fixes exist.

4. **Defensive: clear `lastPhoneFix` when leaving the phone provider** (already partially handled — extend to also clear the one-shot preview).

## Files touched

- `src/pages/InstructorLiveSession.tsx` — add one-shot `getCurrentPosition` effect; relax the `active` prop on `PhoneLastLocationCard`.
- `src/components/instructor/tracking/MiniLiveMap.tsx` — replace blocking overlay with a non-blocking badge.

## Out of scope

- No DB or RPC changes.
- Background streaming behaviour (`usePhoneTrackingStreamer`) and writes to `live_pupil_positions` remain gated behind *Start phone tracking* + a selected pupil, as today.
