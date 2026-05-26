## Problem

You're on `/instructor/tracking?fullscreen=true` but no tracking session is currently active. The fullscreen branch in `InstructorLiveSession.tsx` (line 1378) only renders when **both** `isSessionActive` AND `isFullscreenMode` are true. With session inactive, the code falls through to the standard layout (line 1476) — which wraps everything in `InstructorPortalLayout` (top header + bottom nav) and stacks:

1. Header (~50px)
2. Mini map (28vh, min 180px)
3. Mode selector (3 rows)
4. Tracker + Pupil tile
5. "Start tracking" / "Start lesson" CTA

On a 390×584 viewport that CTA sits well below the fold, so it looks like "the page is too big and there's no track button". The `?fullscreen=true` param is a leftover from a previous session that ended without being cleared.

## Fix

**`src/pages/InstructorLiveSession.tsx`** — two small changes, no business logic touched:

1. **Clear stale fullscreen param.** Add a `useEffect` that, when `isFullscreenMode && !isSessionActive`, calls `navigate("/instructor/tracking", { replace: true })` so the URL no longer claims fullscreen mode once the session has ended.

2. **Make the Start CTA reachable above the fold on short viewports.** In the standard-layout block (around lines 1593–1610), reduce the mini-map's height clamp from `28vh / min 180 / max 260` to roughly `22vh / min 140 / max 220`, and tighten the spacer at line 1591 from `height: 14` to `height: 8`. This brings the CTA visible on a 584px viewport without affecting larger screens.

No changes to:
- the fullscreen active-session view
- session start/stop logic, providers, or data flow
- `InstructorPortalLayout` chrome
- mobile vs desktop branching anywhere else

## Out of scope

- Redesigning the standard tracking layout
- Any change to `LiveTrackingMap.tsx` / car icon work
- Routing or auth changes
