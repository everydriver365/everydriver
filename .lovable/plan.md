## Goal

Tapping the car marker on the live Track map opens a small Google Maps InfoWindow showing **pupil name**, **current speed**, and **last update time**. Tapping the map or the InfoWindow's close button dismisses it. Content updates live while open.

## Changes

### 1. `src/components/instructor/tracking/SatNavLiveMap.tsx`

- Add optional prop `pupilName?: string | null` to `SatNavLiveMapProps`.
- Add a ref `infoWindowRef = useRef<google.maps.InfoWindow | null>(null)` and a small helper `buildInfoHtml(pupilName, speedMph, lastSeenAt)` that returns sanitised HTML:
  - Line 1: pupil name (or "Test route" when null).
  - Line 2: speed in **mph** (convert from `speedKmh` using the existing imperial convention — `Math.round(speedKmh * 0.621371)`); show "—" if `speedKmh` is null.
  - Line 3: "Updated <relative>" via `formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })`; "No fix yet" if null.
  - Inline styles only (Google strips classes): white card, 12px font, 8px padding, navy text `#1F2C4A`, 600 weight for name.
- In the **map-init** branch (around line 577) and the **first-marker-creation** branch (around line 714) and the **alt branch** (~line 813), after creating `markerRef.current`, attach a `click` listener (track via `mapListenersRef`):
  ```ts
  markerRef.current.addListener("click", () => {
    if (!infoWindowRef.current) infoWindowRef.current = new google.maps.InfoWindow();
    infoWindowRef.current.setContent(buildInfoHtml(pupilName, speedKmh, lastSeenAt));
    infoWindowRef.current.open({ map, anchor: markerRef.current! });
  });
  ```
- Live-refresh while open: in a small `useEffect` keyed on `[pupilName, speedKmh, lastSeenAt]`, if `infoWindowRef.current` has a map (`getMap()` truthy), call `setContent(...)` so the values stay current as polls arrive.
- Cleanup: in the existing teardown (~line 590), call `infoWindowRef.current?.close()` and null it.

### 2. `src/pages/InstructorLiveSession.tsx`

- In the fullscreen branch JSX (~line 1393), pass `pupilName={currentPupil?.name ?? null}` to `<SatNavLiveMap ... />`.
- No other call sites touched (mini map already shows pupil name in its surrounding card).

## Out of scope

- `LiveTrackingMap.tsx`, `GoogleLiveTrackingMap.tsx`, `MiniLiveMap` — not changed.
- Camera/follow logic, animation loop, polyline trail, shadow halo — not changed.
- No mobile layout changes elsewhere.
- No backend / RLS / data-shape changes — uses existing props only.
