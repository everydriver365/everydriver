

# Make the Live Map Work + Quartix Fallback

## What We Know

1. The server-side `quartix-sync` IS working -- it updates `gps_devices` every 15 seconds with real coordinates
2. The `InstructorLiveSession` page already subscribes to `gps_devices` changes via Realtime + 5s polling fallback
3. The `LiveTrackingMap` component renders a marker at the position from props
4. Quartix does NOT offer an embeddable iframe or map widget -- their portal is a closed web app

**The live map should already be working.** The vehicle was simply parked during testing, so nothing moved. The architecture is sound.

## What to Improve

### 1. Show vehicle position BEFORE starting a session
Currently the map only renders during an active session. Add a mini live map on the pre-session screen so instructors can see their vehicle's last known position and confirm tracking is working before they start.

### 2. Add "Open in Quartix" button as fallback
A simple button that opens `https://qws4.quartix.com` in a new tab. This gives instructors access to Quartix's own real-time map (with sub-second updates) when they want a second view.

### 3. Show "Last updated X seconds ago" indicator
Add a visible timestamp showing when the position last updated, so instructors can see the server sync is actively working.

## Changes

### File: `src/components/instructor/tracking/MiniLiveMap.tsx` (New)
A compact Leaflet map component (200px tall) that:
- Shows the vehicle marker at its last known position from `gps_devices`
- Displays a status badge: "Live" (green pulse) if last_seen_at < 30s ago, "Last seen X ago" otherwise
- Renders on the pre-session screen so the instructor sees their car before starting

### File: `src/components/instructor/tracking/QuartixLiveButton.tsx` (New)
A styled card/button component that:
- Opens `https://qws4.quartix.com` in a new browser tab
- Shows "Open Quartix Live Tracking" with a brief description
- Appears on the pre-session screen below the mini map

### File: `src/pages/InstructorLiveSession.tsx` (Modify)
- Import and render `MiniLiveMap` in the pre-session view, passing `device.last_latitude`, `device.last_longitude`, and `device.last_seen_at`
- Import and render `QuartixLiveButton` below the mini map
- Add a "Last synced X seconds ago" text indicator near the GPS status hero using `device.last_seen_at`

## Technical Details

### MiniLiveMap Component
```text
Props:
  - latitude: number | null
  - longitude: number | null  
  - heading: number | null
  - lastSeenAt: string | null
  - isActive: boolean

Rendering:
  - Leaflet map (non-interactive, no zoom controls)
  - Car marker icon (same style as LiveTrackingMap)
  - Status badge overlay in top-left corner
  - "No position yet" placeholder if lat/lng are null
```

### QuartixLiveButton Component
```text
- Opens https://qws4.quartix.com in new tab via window.open()
- Styled as a Card with an ExternalLink icon
- Secondary text: "View real-time tracking in the Quartix portal"
```

### InstructorLiveSession Layout (pre-session view)
```text
Current:                          Updated:
+---------------------------+     +---------------------------+
| GPS Status Hero           |     | GPS Status Hero           |
+---------------------------+     | Last synced 5s ago        |
| Tracker Selector          |     +---------------------------+
+---------------------------+     | Mini Live Map (200px)     |
| Session Start Panel       |     | [Live] badge              |
+---------------------------+     +---------------------------+
| Recent Sessions           |     | Tracker Selector          |
+---------------------------+     +---------------------------+
                                  | Open Quartix Live [->]    |
                                  +---------------------------+
                                  | Session Start Panel       |
                                  +---------------------------+
                                  | Recent Sessions           |
                                  +---------------------------+
```

## Summary
- 2 new small components (~60 lines each)
- 1 modified file (add imports + render in pre-session view)
- No database changes needed
- No edge function changes needed
