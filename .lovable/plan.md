

# Add Speed Badge on Map Next to Arrow Marker

## What This Does

Adds a floating speed badge directly on the map, positioned next to the vehicle arrow marker. The badge will show the current speed (e.g., "34 mph") and change color based on status: green when driving normally, red when overspeeding, and grey when offline.

## Approach

Use a Google Maps **OverlayView** to render a small DOM-based speed label that tracks the marker position on the map canvas. This is more reliable than marker labels and allows full styling control.

## Technical Details

### File: `src/components/instructor/GoogleLiveTrackingMap.tsx`

**1. Create a custom OverlayView class (inside the map init effect)**

After the map is created, define a custom overlay class that:
- Draws a styled `<div>` with the speed text (e.g., "34 mph")
- Positions it offset slightly above-right of the marker
- Updates position whenever `draw()` is called (on pan/zoom)

Store the overlay instance in a new `speedOverlayRef`.

**2. Update the overlay in Effect #3 (marker update effect)**

When the marker position updates, also update the overlay's:
- Position (same lat/lng as the marker)
- Speed text (using existing `speedText` value)
- Background color (using existing `markerColor` logic: green/red/grey)
- Visibility (hide when speed is "--")

**3. Cleanup on unmount**

Remove the overlay from the map when the component unmounts.

### Visual Design

- Small rounded pill badge: white text on colored background
- Offset ~20px above the arrow marker so it doesn't overlap
- Font size ~11px, bold, with a subtle shadow for readability over the map
- Colors match the arrow: green (normal), red (overspeeding), grey (offline)

