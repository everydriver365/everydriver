## Fix mid-tween jump in car-marker interpolation

### Current state
`SatNavLiveMap` already has continuous interpolation: `fromPosRef` → `targetPosRef` tweened in a `requestAnimationFrame` loop with adaptive `tweenMs` (250–1200ms), `easeInOut`, and `lerpAngle`.

### Real bug
When a new fix arrives **before the previous tween finishes** (e.g. tween was 1200ms, next fix lands at 800ms), `applyFix` sets:

```ts
const fromBase = targetPosRef.current; // ← previous DESTINATION, not current marker pos
fromPosRef.current = { ...fromBase, t: now };
targetPosRef.current = { lat, lng, heading, t: now };
```

The marker is currently rendered ~⅔ of the way along the previous segment, but the new tween starts from the previous *destination*. Next frame, the marker visibly **jumps forward** to that destination before tweening to the new fix. This is exactly the "jumping between updates" the user is reporting.

### Fix — start each tween from the marker's actual current position

Capture the marker's live animated position (and current interpolated heading) at the moment a new fix arrives, and use that as the new `fromPos`. This gives a seamless C0-continuous path.

### Changes (single file: `src/components/instructor/tracking/SatNavLiveMap.tsx`)

1. **New ref** alongside `fromPosRef`/`targetPosRef`:
   ```ts
   const currentRenderRef = useRef<{ lat: number; lng: number; heading: number } | null>(null);
   ```
   The rAF `tick` writes the interpolated `{lat, lng, hd}` it just rendered into this ref every frame.

2. **In `applyFix` (~line 1003)**, replace `fromBase = targetPosRef.current ?? marker.getPosition()` with:
   ```ts
   const fromBase = currentRenderRef.current
     ?? targetPosRef.current
     ?? (markerRef.current?.getPosition() ? { lat: ..., lng: ..., heading: rotation } : null);
   ```
   So the tween always starts from where the marker visually is right now.

3. **Tween duration recalc**: when starting mid-tween, the human-perceived speed shouldn't double. Keep the existing adaptive `tweenMs` (based on `gapMs * 0.8`) — that's already correct.

4. **In `tick` (~line 1066-1068)**, after computing `lat`/`lng`/`hd`, write:
   ```ts
   currentRenderRef.current = { lat, lng, heading: hd };
   ```

5. **Snap branches** (small-movement <3 m line 989, jump-rejection >500 m line 1008): also reset `currentRenderRef.current` to the snapped position so the next tween starts cleanly.

6. **Cleanup**: null `currentRenderRef.current` in the rAF effect teardown.

### Out of scope
- `LiveTrackingMap.tsx`, `GoogleLiveTrackingMap.tsx`, `MiniLiveMap` — separate components, not in scope
- Heading smoothing (already shipped previous turn)
- Camera follow, polyline trail, snap-to-roads

### Result
The car marker moves fluidly between fixes with no visible jump, even when new fixes arrive faster than the previous tween could complete.