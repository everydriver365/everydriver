## Problem

On `/instructor/tracking` the Mini map shows "Waiting for GPS…". Charlotte (Radius tracker) is reporting fresh fixes every 30s in the DB — the page is just set to **Phone Tracking**, where coordinates come from the browser's own `geolocation` API, not the database. Until the user (a) grants location permission and (b) confirms streaming, `lastPhoneFix` is null and the map has nothing to plot.

Per the live-data-only rule I won't backfill Phone mode with Radius coordinates (that would mislabel the source). Instead, make the empty state tell the user exactly why nothing is showing and what to do.

## Changes

Scope: **frontend only**, presentation copy + a small conditional. No data fetching, no business logic changes.

1. **`src/components/instructor/tracking/MiniLiveMap.tsx`**
   - Add two optional props: `sourceLabel?: "phone" | "radius"` and `needsAction?: "permission" | "confirm-start" | null`.
   - Replace the single "Waiting for GPS…" badge with a 3-state empty UI:
     - `needsAction === "permission"` → "Location permission needed" + small "Enable location" hint.
     - `needsAction === "confirm-start"` → "Tap Start tracking to begin phone GPS".
     - Otherwise → keep current "Waiting for GPS…" badge (Radius case, no fix yet).
   - No layout change beyond the badge slot.

2. **`src/pages/InstructorLiveSession.tsx`** (the two `<MiniLiveMap …/>` sites at ~L1394 and ~L1559)
   - Pass `sourceLabel={isPhoneProvider ? "phone" : "radius"}`.
   - Pass `needsAction` derived from existing state already in this file:
     - `isPhoneProvider && locationPermissionStatus !== "granted"` → `"permission"`
     - `isPhoneProvider && locationPermissionStatus === "granted" && !phoneStreamingConfirmed` → `"confirm-start"`
     - else → `null`.

That's it — no edits to the streamer, the poller, or `SatNavLiveMap`.

## Why not auto-switch to Radius

The user explicitly chose Phone in the provider dropdown (saved on `instructors.preferred_tracking_provider`). Silently swapping providers or borrowing Radius coords would violate the project's live-data-only rule and hide the real state. The fix surfaces the real state clearly.

## Verification

- Open `/instructor/tracking` with provider = Phone, permission not yet granted → badge reads "Location permission needed".
- Grant permission, don't tap Start → badge reads "Tap Start tracking to begin phone GPS".
- Tap Start → first `geolocation` fix arrives, badge flips to green "Live", marker draws.
- Switch provider to Radius (Charlotte) → badge immediately shows "Live" using `device.last_latitude/longitude` from DB.
