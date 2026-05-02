## Fix: vehicle marker too large and hidden behind bottom tile

In `src/components/instructor/tracking/SatNavLiveMap.tsx`:

1. **Shrink the marker** (line 96 in `getArrowIcon`):
   - Fullscreen scale `3.6 → 2.4`
   - Inline scale `3.0 → 2.2`

2. **Lift the marker above the bottom tile** (line 338 in the animation loop's off-center pan):
   - Increase the downward camera offset from `clientHeight * 0.20` to `clientHeight * 0.30`
   - This shifts the map target lower so the vehicle marker sits higher in the viewport (~35–40% from the bottom), clearing the ~85px speed/engine bottom tile.

No other behaviour changes — smoothing, two-tone polyline, decluttered styles, and heading-up rotation all preserved.
