

# Fix: Confused / Tangled Blue Track Line

## Problem

Two systems fight over the polyline:
- **Instant append** adds raw (noisy) GPS points every time the device updates
- **Snap-to-road** replaces the entire polyline path every 5 seconds with clean road-snapped coordinates

After each snap-to-road replacement, the instant append doesn't know where the snapped path ended, so it appends the next raw point at a mismatched position -- creating zigzags, loops, and tangles.

Additionally, raw GPS points have inherent jitter (several meters of error), which creates a messy appearance even without the snap conflict.

## Solution

Separate the polyline into two layers:

1. **Snapped polyline** (main blue line) -- only updated by the 5-second snap-to-road cycle. This is the clean, road-aligned route.
2. **Raw tail polyline** (thin blue line) -- extends from the last snapped point to the current marker position. This gives instant visual feedback without corrupting the main line.

When snap-to-road runs, it absorbs the raw tail into the snapped line and resets the tail.

## Technical Changes

### File: `src/components/instructor/GoogleLiveTrackingMap.tsx`

**Add a second polyline for the raw tail (Effect #2, map init)**
- Create `tailPolylineRef` alongside the existing `polylineRef`
- Style it slightly thinner or with lower opacity so the transition is seamless

**Update Effect #3 (instant marker update)**
- Instead of appending to the main polyline, append only to the tail polyline
- Reset `lastAppendedRef` properly

**Update Effect #5 (5-second snap-to-road tick)**
- After `setPath()` on the main polyline, clear the tail polyline
- Set the tail's starting point to the last point of the snapped path
- Update `lastAppendedRef` to match the last snapped point so the tail continues cleanly

**Add distance filtering**
- Increase the minimum distance threshold from ~3m to ~5m to filter out GPS jitter
- Skip points that are clearly erroneous (huge jumps > 500m in a single update)

### Summary of changes

```text
polylineRef      = snapped route (updated every 5s by snap-to-road)
tailPolylineRef  = raw extension (updated instantly, cleared after each snap cycle)

Flow:
  Device update -> append to tail polyline (instant)
  5s tick       -> snap all points -> replace main polyline -> clear tail
```

No new files, no backend changes. All changes in `GoogleLiveTrackingMap.tsx`.
