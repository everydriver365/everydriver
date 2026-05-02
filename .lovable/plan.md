# SatNavLiveMap polish pass

Targeted edits to `src/components/instructor/tracking/SatNavLiveMap.tsx`. No other files change. All existing behavior (Snap-to-Roads, realtime trail, road name, speed/limit, ignition, fullscreen layout, live badge, Google Maps loading) is preserved.

## 1. Marker rotation bug (animation loop, ~line 434)

Currently:
```ts
marker.setIcon(getArrowIcon(0, isActiveRef.current));
```
Replace with the interpolated heading from the lerp above:
```ts
marker.setIcon(getArrowIcon(hd, isActiveRef.current));
```
Now the arrow visually rotates smoothly between fixes.

## 2. Conditional camera follow (animation loop, ~line 442)

Wrap the `panTo` so dragging works in card mode:
```ts
if (fullscreenRef.current) {
  const latLng = new google.maps.LatLng(lat, lng);
  map.panTo(latLng);
}
```
Fullscreen still locks to the vehicle; card mode lets the user pan/zoom freely.

## 3. Icon scaling via ref (`getArrowIcon`, ~lines 167–176)

Switch the `scale` to read `fullscreenRef.current` so changing fullscreen at runtime updates the icon size, and drop `fullscreen` from the `useCallback` deps to keep the callback identity stable:
```ts
const getArrowIcon = useCallback((rotation: number, active: boolean): google.maps.Symbol => ({
  path: "M 0,-12 L -7,11 L 0,6 L 7,11 Z",
  fillColor: active ? "#2563eb" : "#9ca3af",
  fillOpacity: 1,
  strokeColor: "white",
  strokeWeight: 3,
  scale: fullscreenRef.current ? 2.4 : 2.2,
  rotation,
  anchor: new google.maps.Point(0, 0),
}), []);
```
Blue/grey active styling and white outline are unchanged.

## 4. `appendTrailPoint` dedupe helper

Add a small helper near the other refs/utilities (above the `useEffect`s that mutate `pathRef.current`):
```ts
const appendTrailPoint = useCallback((lat: number, lng: number): boolean => {
  const last = pathRef.current[pathRef.current.length - 1];
  if (last && Math.abs(last.lat() - lat) < 0.000005 && Math.abs(last.lng() - lng) < 0.000005) {
    return false;
  }
  pathRef.current.push(new google.maps.LatLng(lat, lng));
  return true;
}, []);
```

Use it in three places (replacing the existing raw `pathRef.current.push(...)` calls), keeping all surrounding logic (`renderPolylines`, `requestSnap`, the realtime subscription guard, the movement filter) intact:

- Historical trail loader (~line 280): `appendTrailPoint(latitude, longitude);`
- Realtime INSERT handler (~line 311): replace push with `if (appendTrailPoint(p.latitude, p.longitude)) { renderPolylines(); requestSnap(); }` — note the existing 0.000005 distance check there can be removed since the helper covers it.
- New-fix branch (~line 394): `if (appendTrailPoint(latitude, longitude)) { renderPolylines(); requestSnap(); }` — preserved inside the existing `movingFastEnough && metresFromPrev >= 3` gate.

Snap-to-Roads, realtime trail, and polyline rendering keep working — the helper only suppresses near-duplicate pushes.

## 5. "Miles today" in the bottom bar

`dailyMiles` already exists (line 135) but is unused. In the card-mode bottom bar (between the speed-limit roundel and the engine status, after the spacer split), add an iOS-style metric:

```tsx
{dailyMiles != null && (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
    <span style={{ fontSize: 15, fontWeight: 600, color: "#1c1c1e", lineHeight: 1 }} className="tabular-nums">
      {dailyMiles}
    </span>
    <span style={{ fontSize: 11, color: "#8e8e93", marginTop: 2 }}>miles today</span>
  </div>
)}
```
Subtle, matches existing typography (SF-style sizes, `#8e8e93` secondary, tabular-nums). Placed before the engine status so the engine indicator stays at the far right.

## Out of scope / unchanged
Supabase table names, Google Maps loader, Snap-to-Roads logic, live badge, road name banner, speed and speed-limit display, ignition status, and the overall fullscreen vs card layout structure are not touched.
