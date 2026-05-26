## Fallback orientation when `last_heading` is null

### Problem
When `heading` from the device is `null`/undefined (some GPS sources, app backgrounded, or first fix after reacquisition), the current code falls back to `prev?.heading ?? 0` — meaning the marker either freezes at its old angle or points due north until a real heading arrives.

### Approach
Derive a bearing from the **movement vector** between the previous accepted fix and the new fix whenever:
- `heading` is null/non-finite, AND
- the vehicle is moving fast enough (`movingFastEnough`), AND
- the distance moved is large enough to give a reliable bearing (≥5 m — sub-jitter)

Feed that derived bearing through the **same smoothing pipeline** (buffer → circular mean → dead-zone → max-step clamp) so the marker behaves identically whether the bearing came from the device or was computed locally.

### Changes (single file: `src/components/instructor/tracking/SatNavLiveMap.tsx`)

1. **Add helper** (module-scope, near `headingToCardinal`):
   ```ts
   function bearingBetween(lat1, lng1, lat2, lng2): number
   ```
   Standard forward-azimuth formula, returns 0–360°.

2. **Update the heading-smoothing block** (~lines 878–919):
   - Compute `effectiveHeading`:
     - If `heading` is finite → use it.
     - Else if `prev` exists, `movingFastEnough`, and `metresFromPrev >= 5` → `bearingBetween(prev.lat, prev.lng, latitude, longitude)`.
     - Else → `null` (skip sampling this fix).
   - Replace the `typeof heading === "number" && Number.isFinite(heading)` guard with a check on `effectiveHeading != null`.
   - Push `effectiveHeading` into `headingBufferRef` — smoothing/dead-zone/clamp logic stays unchanged.

3. **Stationary fallback unchanged** — if not moving and no smoothed value yet, keep `prev?.heading ?? 0`.

### Out of scope
- Other map components, animation loop, polyline, camera follow logic
- Backend / `last_heading` writes

### Result
Marker arrow points along the actual direction of travel even when the device omits `heading`, with no visible difference in smoothing behaviour between device-supplied and derived bearings.