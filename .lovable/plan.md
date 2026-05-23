## iOS WKWebView / Despia TestFlight GPS fixes

Scope: only `src/components/instructor/LiveTrackingMap.tsx` and `src/hooks/usePhoneTrackingStreamer.ts`. No Supabase RPC, road matching, speed panel, or other component changes.

---

### PART 1 — iOS detection (both files)

Add at module top:
```ts
const isIOS = typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent);
```

### PART 2 — Smoother marker movement (LiveTrackingMap.tsx)

- Build the divIcon HTML **once** on mount; stop calling `marker.setIcon(icon)` on every fix.
- Give the rotating inner div a stable class (`gps-car-rotator`) and add `will-change: transform` to it.
- On every fix, update rotation by mutating the DOM directly:
  ```ts
  const el = markerRef.current?.getElement()?.querySelector<HTMLElement>(".gps-car-rotator");
  if (el) el.style.transform = `rotate(${rotation}deg)`;
  ```
- Update marker position with `setLatLng` as today.
- Auto-centre branch:
  - iOS: `map.setView([lat, lng], map.getZoom(), { animate: false })`
  - non-iOS: `map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 })`
- Recolour ring on `isConnected` change by toggling a CSS variable / `style.background` on the ring div, not via icon rebuild.

### PART 3 — Auto-follow reliability on touch (LiveTrackingMap.tsx)

- Add `isProgrammaticMoveRef = useRef(false)` and `dragResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`.
- Replace `map.on("dragstart", …)` with:
  ```ts
  map.on("movestart", () => {
    if (isProgrammaticMoveRef.current) return;
    setUserDragged(true);
    if (dragResetTimerRef.current) clearTimeout(dragResetTimerRef.current);
    dragResetTimerRef.current = setTimeout(() => setUserDragged(false), 30_000);
  });
  map.on("moveend", () => { isProgrammaticMoveRef.current = false; });
  ```
- Before every programmatic `setView` / `flyTo` (auto-centre, recenter button, initial centre), set `isProgrammaticMoveRef.current = true`.
- Clear the 30s timer on cleanup.
- Keep the existing Recenter button; on click it also clears the timer and resets `userDragged`.

### PART 4 — First position jump (LiveTrackingMap.tsx)

- Add `initialCentreSet = useRef(false)`.
- In the fix-handling effect, on the first non-null `(latitude, longitude)`:
  - Mark programmatic, call `map.setView([lat, lng], 17, { animate: false })`, set `initialCentreSet.current = true`, then return (skip the normal pan branch for that tick).
- Subsequent fixes use the iOS/non-iOS branch from PART 2.
- Removes the visible jump from `[54.5, -3.5]` to the real location.

### PART 5 — GPS accuracy + startup delay (usePhoneTrackingStreamer.ts)

- Add module-level `isIOS` const (same detector).
- Add `startedAtRef = useRef<number>(0)`; set `startedAtRef.current = Date.now()` when `watchPosition` is registered; reset on cleanup.
- Inside the watch callback, when `isIOS`:
  - If `Date.now() - startedAtRef.current < 3000` → drop the fix (do not call `onPosition`, `update_live_position`, or `record_phone_gps_point`).
  - Tighten accuracy gate: drop if `accuracy != null && accuracy > 20` (instead of 35).
- Non-iOS branch keeps existing 35m gate and no startup delay.
- Everything else (jitter filter, RPCs, speed-limit cache) untouched.

### PART 6 — deferred

No changes to Supabase RPCs, OSRM road matching, speed panel UI, Recenter button, or any other component. No new dependencies.

---

### Output format I'll deliver after approval

PART 1 / PART 2 / PART 3 / PART 4 / PART 5 verified clean / PART 6 deferred — patches applied to the two files only, with a short summary of each change block.
