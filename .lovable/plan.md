## Smooth heading rotation on SatNav live map

### Problem
`rotation` is set directly from each new `heading` fix (line ~867). Raw GPS bearings jitter ±5–15° per fix, causing the car arrow (and sat-nav camera) to twitch visibly even when driving straight.

### Approach
Add a circular-mean smoothing buffer for successive `last_heading` values, plus a dead-zone for tiny changes.

### Changes (single file: `src/components/instructor/tracking/SatNavLiveMap.tsx`)

1. **New ref** alongside `fixGapsRef`:
   ```ts
   const headingBufferRef = useRef<number[]>([]); // last N raw headings
   const smoothedHeadingRef = useRef<number | null>(null);
   ```

2. **New helper** (module-scope, near `lerpAngle`):
   - `circularMean(degrees: number[]): number` — averages sin/cos components so 359°/1° wrap correctly.

3. **Replace the `rotation` calc** (~lines 865–869) with:
   - Only push raw `heading` into `headingBufferRef` when `movingFastEnough` and heading is finite.
   - Keep buffer length 5 (≈10s at 2s fixes).
   - Compute `candidate = circularMean(buffer)` when buffer has ≥2 entries, else use raw heading.
   - Apply **dead-zone**: if `|angleDelta(candidate, smoothedHeadingRef.current)| < 3°`, keep previous smoothed value (prevents micro-twitch).
   - Apply **max-step clamp**: limit change to e.g. 25°/fix so a single outlier can't snap the arrow.
   - When stationary, hold `smoothedHeadingRef.current` (no buffer update, no rotation change) — matches current behaviour.
   - Reset buffer when `tooFar` outlier is rejected or after a >15s gap.
   - Use `smoothedHeadingRef.current ?? prev?.heading ?? 0` as the final `rotation` value passed into `fromPosRef` / `targetPosRef` / `getArrowIcon`.

4. **Animation loop unchanged** — existing `lerpAngle(from.heading, target.heading, e)` already tweens between smoothed values, so frame-to-frame motion stays continuous.

### Out of scope
- `LiveTrackingMap.tsx`, `GoogleLiveTrackingMap.tsx`, `MiniLiveMap`
- Camera follow logic, polyline trail, marker icon
- Backend / data fetching

### Expected result
Marker arrow and sat-nav camera rotate smoothly, ignore sub-3° jitter, and can't snap >25° from a single bad fix — while still responding within ~2 fixes to a real turn.