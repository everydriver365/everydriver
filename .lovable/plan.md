

# Add Live Map to Fleet Dashboard

## What You'll Get
A new **Live Map** tab on the Fleet Dashboard showing your vehicle's real-time position on an interactive map -- the same live tracking data from Quartix, displayed directly in your app.

## Features
- Interactive map showing all your vehicles with live position markers
- Auto-refreshing every 10 seconds to keep positions current
- Vehicle status indicators (moving/idle/parked) with color-coded markers
- Current road name, speed, and ignition status displayed in a popup
- Click a vehicle to center the map and see details
- "Navigate to" button to open directions in Google/Apple Maps

## How It Works
The app already pulls live GPS data from Quartix via your backend. This feature reuses that data and renders it on a Leaflet map inside the Fleet Dashboard -- no iframe or external portal needed.

## Technical Details

### New File
- **`src/components/instructor/FleetLiveMap.tsx`** -- A new component that:
  - Fetches all active devices from `gps_devices` table for the instructor
  - Subscribes to Supabase Realtime for live position updates
  - Renders a full-height Leaflet `MapContainer` with car markers (reusing existing icon patterns from `HomeMapHero` and `AdminLiveMapView`)
  - Shows vehicle name, speed (mph), road name, and last-seen time in marker popups
  - Color-codes markers: green (moving), amber (idle), grey (parked)
  - Auto-fits map bounds to show all vehicles

### Modified File
- **`src/pages/InstructorFleetDashboard.tsx`** -- Add a "Live Map" tab (with `MapPin` icon) to the existing tab bar, rendering the `FleetLiveMap` component

### Data Flow
```text
Quartix API --> quartix-poller edge function --> gps_devices table --> Realtime subscription --> FleetLiveMap component
```

No new database tables, edge functions, or API keys are needed -- this purely surfaces existing data on a new map view.

