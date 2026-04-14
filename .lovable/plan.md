

## Fix delay in drawing the blue route trail

### Root cause
There are two layers of delay in the current trail-drawing pipeline:

1. **Snap debounce (1500ms)**: When a new GPS point arrives via realtime, `scheduleSnap()` sets a 1500ms timeout before calling `redrawPolyline()`.
2. **Snap-to-road API call**: `redrawPolyline()` calls the `snap-to-road` edge function (Google Roads API), adding another ~500-1500ms of network latency.

Combined, this means the main blue polyline can lag **2-3 seconds** behind the actual vehicle position. The thin "tail" polyline does append points immediately (line 331-341), but only when the device position changes — and it gets cleared every time the snap finishes, creating visual gaps.

### Fix
Show raw GPS points on the main polyline **immediately**, then upgrade to snapped geometry in the background:

1. **Immediate raw draw**: When new points arrive (in `scheduleSnap`), instantly update the main polyline with the raw (unsnapped) path so the line visually extends without delay.
2. **Background snap upgrade**: Keep the 1500ms debounce for the snap-to-road call, but now it just *refines* an already-visible line rather than being the first time the line appears.
3. **Reduce snap debounce**: Lower from 1500ms to 800ms so snapped geometry arrives sooner.
4. **Keep tail polyline**: Continue appending to the tail for the segment between the last snap and the current position.

### File changed
- `src/components/instructor/GoogleLiveTrackingMap.tsx` — Update `scheduleSnap` to immediately draw raw points on the main polyline, reduce debounce to 800ms, and refine `redrawPolyline` to act as a background upgrade.

