

## Upgrade Live Tracking to Sat-Nav Style

The current `MiniLiveMap` already renders a full Google Map with live tracking. The upgrades focus on making it **feel like a sat-nav** — heading-up rotation, tilted perspective, floating HUD overlays for speed/road/limits — rather than replacing the layout.

### What changes

**1. Expand and enhance `MiniLiveMap.tsx` → rename to `SatNavLiveMap.tsx`**
- Increase map height from `h-[200px]` to `h-[55vh]` for a dominant, immersive view
- Enable **heading-up mode**: `map.setHeading(deviceHeading)` so the road ahead always points up
- Add **3D tilt**: `tilt: 45` for perspective depth like Google/Waze navigation
- Increase zoom from 16 → 17 for closer vehicle tracking
- Upgrade vehicle marker: larger glowing arrow with drop shadow
- Keep existing polyline trail, auto-follow, and historical trail loading

**2. Float telemetry HUD on top of the map** (move data out of GPSStatusHero into map overlays)
- **Top bar** (frosted glass): Live badge + road name
- **Bottom-left**: Large speed readout (e.g. "34 mph") with speed limit roundel beside it — roundel pulses red when exceeding
- **Bottom-right**: Engine status dot + daily mileage
- All overlays use `backdrop-blur-md bg-white/80` for frosted glass effect

**3. Simplify `GPSStatusHero`**
- Strip out speed, road name, and telemetry rows (now shown on the map HUD)
- Keep only: connection status header (Connected/Parked/Offline), device name, reconnect button
- This becomes a compact status bar above the map instead of a large card

**4. Update `InstructorLiveSession.tsx`**
- Replace `MiniLiveMap` import with `SatNavLiveMap`
- Pass additional props: `speedKmh`, `speedLimitKmh`, `roadName`, `ignitionOn`, `dailyDistanceKm`
- Remove redundant telemetry display from GPSStatusHero props

### New props for SatNavLiveMap
```typescript
interface SatNavLiveMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh: number | null;
  speedLimitKmh: number | null;
  roadName: string | null;
  lastSeenAt: string | null;
  isActive: boolean;
  sessionId?: string | null;
  ignitionOn?: boolean | null;
  dailyDistanceMiles?: number | null;
}
```

### Visual layout (mobile 390px)
```text
┌──────────────────────────────┐
│ Connected · Radius · Device  │  ← Compact GPSStatusHero
├──────────────────────────────┤
│  ● Live    A246 High Street  │  ← Frosted overlay on map
│                              │
│         GOOGLE MAP           │
│        (heading-up,          │
│         tilted 45°,          │
│         zoom 17)             │
│                              │
│  ┌──────┐ ┌───┐             │
│  │34 mph│ │30 │  🟢 Eng On  │  ← Floating HUD
│  └──────┘ └───┘   12 mi     │
└──────────────────────────────┘
│ Dashcam Portal        → │
│ Session Controls         │
│ Recent Sessions          │
```

### Files
- **Create** `src/components/instructor/tracking/SatNavLiveMap.tsx`
- **Edit** `src/components/instructor/tracking/GPSStatusHero.tsx` — strip telemetry section
- **Edit** `src/pages/InstructorLiveSession.tsx` — swap component + pass new props
- **Keep** `MiniLiveMap.tsx` for now (can delete later)

