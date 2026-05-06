## Issue

After picking Phone GPS, the mini map stays empty because the one-shot `getCurrentPosition` call silently fails (preview iframes and many desktop browsers time out on `enableHighAccuracy: true`), and the failure is only logged to the console — the user gets no feedback and no retry.

## Fix

In `src/pages/InstructorLiveSession.tsx`, harden the one-shot phone-preview effect:

1. **Two-stage fetch** — first try `enableHighAccuracy: true` with an 8s timeout; on any error, retry with `enableHighAccuracy: false`, 15s timeout, and `maximumAge: 60000` (lets the browser return a cached coarse fix).
2. **Visible feedback** — if the coarse fallback also fails, surface a toast:
   - `PERMISSION_DENIED` → "Location was blocked. Allow location for this site/app and try again."
   - other errors → "GPS didn't respond. If you're inside a preview window, open the app in its own tab." (preview iframes block geolocation unless the app is opened in its own tab).
3. Keep the existing cancel/cleanup logic so navigating away or starting the full streamer aborts the preview fetch.

No DB or hook changes; this is purely a client-side reliability + UX fix.

## File touched

- `src/pages/InstructorLiveSession.tsx` — replace the one-shot preview effect with the two-stage fetch + toast.
