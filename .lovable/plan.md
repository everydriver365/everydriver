## Strict mode for Phone GPS preview

Drop the coarse IP/Wi-Fi fallback so the mini map only ever shows a real high-accuracy GPS fix when Phone GPS is selected.

## Change

In `src/pages/InstructorLiveSession.tsx`, replace the one-shot phone-preview effect:

- Single `getCurrentPosition` call with `enableHighAccuracy: true`, `timeout: 15000`, `maximumAge: 0`.
- Reject any returned fix where `accuracy > 200 m` (Wi-Fi / IP-derived fixes are typically 1000–50000 m).
- On `PERMISSION_DENIED`, show a toast.
- On any other error or rejected coarse fix, stay silent — `MiniLiveMap` will keep showing the "Waiting for GPS…" badge until a real fix arrives or the user taps **Start phone tracking** (which uses `watchPosition` with high-accuracy and naturally produces real GPS fixes once outdoors).
- No change to the Radius branch — already isolated to `gps_devices.last_latitude/longitude`.

## File touched

- `src/pages/InstructorLiveSession.tsx` — replace the preview-fix effect.
