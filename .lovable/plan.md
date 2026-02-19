

# Sat-Nav Experience for Live Tracking

## Overview

Transform the live tracking map into a day-nav-like experience with these enhancements:

## Changes

### 1. Speed Badge Overlay (approved earlier, not yet built)
- Add a floating speed badge on the map next to the arrow marker using a Google Maps `OverlayView`
- Shows current speed in mph, color-matched to the marker (green/red/grey)
- Positioned slightly above-right of the arrow so it follows the vehicle

### 2. Auto-Rotate Map to Heading (North-Up to Track-Up)
- Add a "Track Up" toggle button on the map
- When enabled, the map rotates so the vehicle always faces upward (like a sat-nav)
- Uses `map.setHeading(device.last_heading)` on each position update
- Toggle between Track-Up and North-Up modes with a compass icon button

### 3. Auto-Zoom Based on Speed
- When moving fast (>40 mph), zoom out slightly (zoom 14) for better road awareness
- When moving slowly or stationary, zoom in (zoom 16-17) for detail
- Smooth transitions using `map.setZoom()` with debouncing to avoid constant changes
- Only applies when auto-follow is active (not when user has dragged)

### 4. Larger Bottom Info Panel (Sat-Nav Style)
- Redesign the bottom card to be more prominent with larger speed text
- Add the speed limit roundel (already exists as `SpeedLimitRoundel` component) displayed as an overlay on the map
- Show the road name more prominently, like a sat-nav road banner at the top

### 5. Dark Map Style for Night Mode
- Detect system dark mode preference
- Apply Google Maps dark style JSON when in dark mode for a proper night-driving look

## Technical Details

### File: `src/components/instructor/GoogleLiveTrackingMap.tsx`

**Speed Badge Overlay:**
- Define a `SpeedOverlay` class extending `google.maps.OverlayView` inside the map init effect
- Store in `speedOverlayRef`, update position/text/color in Effect #3

**Track-Up Mode:**
- Add `trackUp` state (default: false)
- In Effect #3, when `trackUp` is true: `map.setHeading(device.last_heading ?? 0)`
- Add compass toggle button in the header bar
- Reset heading to 0 when switching back to North-Up
- Enable `map.setTilt(45)` in track-up mode for a 3D perspective feel

**Auto-Zoom:**
- Add logic in Effect #3: calculate target zoom from speed, apply with debounce
- Only when `!userDragged`

**Sat-Nav Bottom Panel:**
- Enlarge the speed display with the current speed as the hero element
- Add `SpeedLimitRoundel` component next to the speed
- Move road name to a top banner strip below the header

**Dark Map Styling:**
- Use `next-themes` (already installed) to detect theme
- Apply a dark style array to the map via `map.setOptions({ styles: darkStyles })`

### No database or backend changes required.

