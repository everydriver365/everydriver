
# Enhance Greeting Tile with Weather, Road & Nearby Alerts

## Overview

This plan enhances the "Good morning" greeting tile on the instructor mobile home page to display:
- Current road name (from GPS tracking)
- Current weather conditions (temperature and icon)
- Nearby weather/traffic warnings within 3 miles

The design will be compact and non-scrolling, integrating seamlessly into the existing card.

## Current Architecture

The greeting tile is in `InstructorMobileHome.tsx` (lines 328-359). Relevant data sources:

| Hook/Source | Data Available |
|-------------|----------------|
| `useInstructorLastPosition` | `roadName`, `latitude`, `longitude` |
| `useDrivingAlerts` | `alerts[]`, `location` |
| `get-driving-alerts` edge function | Weather + traffic (already fetches current temp, weather code) |

## Implementation Plan

### 1. Enhance Edge Function to Return Current Weather

Modify `supabase/functions/get-driving-alerts/index.ts` to return current weather data alongside alerts:

```typescript
// Add to response:
{
  alerts: [...],
  location: "Birmingham",
  currentWeather: {
    temperature: 12,
    weatherCode: 3,
    description: "Overcast",
    icon: "Cloud",
    windSpeed: 15  // mph
  }
}
```

This data is already being fetched - we just need to include it in the response.

### 2. Update `useDrivingAlerts` Hook

Extend the hook to expose `currentWeather`:

```typescript
interface UseDrivingAlertsResult {
  alerts: DrivingAlert[];
  loading: boolean;
  currentWeather: {
    temperature: number;
    description: string;
    icon: string;
  } | null;
  // ... existing fields
}
```

### 3. Add Radius Filter for Nearby Alerts (3 miles)

Modify the edge function to add distance calculation and filter traffic incidents to 3-mile radius (currently 10km ~ 6 miles):

```typescript
// Change from 10km to ~5km (3 miles)
const radiusKm = 5; // 3 miles ≈ 4.8km
```

### 4. Redesign Greeting Tile Component

Transform the existing greeting card to show contextual information:

**New Layout:**

```text
┌─────────────────────────────────────────┐
│ TODAY              🟢 Live              │
│                                         │
│ Good morning, John!         ☁️ 12°C    │
│ 📍 High Street, Birmingham              │
│                                         │
│ ⚠️ Heavy rain warning nearby            │ (if alerts exist)
└─────────────────────────────────────────┘
```

**Design Details:**
- Weather icon + temperature displayed on the right of the greeting
- Current road shown below greeting with location pin icon
- If alerts exist within 3 miles, show a compact single-line warning
- All content fits without scrolling

### 5. Create Compact Alert Indicator

Instead of showing full alert cards in the greeting, show a condensed summary:
- Show count of nearby warnings
- Tapping expands to the full `DrivingAlertsStrip`
- Use color coding: amber for moderate, red for severe

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/get-driving-alerts/index.ts` | Add `currentWeather` to response, reduce radius to 3 miles |
| `src/hooks/useDrivingAlerts.ts` | Add `currentWeather` to return type and state |
| `src/components/instructor/InstructorMobileHome.tsx` | Redesign greeting tile with weather/road/alerts |

## Technical Details

### Weather Icon Mapping

```typescript
const WEATHER_ICONS: Record<number, string> = {
  0: "Sun",       // Clear
  1: "Sun",       // Mainly clear
  2: "CloudSun",  // Partly cloudy
  3: "Cloud",     // Overcast
  45: "CloudFog", // Fog
  // ... existing mapping in useTomorrowWeather.ts
};
```

### Compact Alert Display Logic

```typescript
// Show at most 1 line for alerts in greeting tile
const compactAlertText = alerts.length > 0 
  ? alerts[0].severity === 'severe'
    ? `⚠️ ${alerts[0].title}`
    : `⚠️ ${alerts.length} warning${alerts.length > 1 ? 's' : ''} nearby`
  : null;
```

### Road Name Source Priority

1. GPS device `last_road_name` (real-time from tracking)
2. Fall back to `location` from alerts (area name from postcode)

## Visual Mockup

```text
Before:
┌────────────────────────────────┐
│ TODAY              🟢 Live     │
│ Good morning, John!            │
│ Enjoy your lessons today...    │
└────────────────────────────────┘

After:
┌────────────────────────────────┐
│ TODAY              🟢 Live     │
│ Good morning, John!    ⛅ 14°C │
│ 📍 Bristol Road, Edgbaston     │
│ 🔶 Strong winds - 28mph       │
└────────────────────────────────┘
```

## Data Flow

```text
InstructorMobileHome
  │
  ├── useDrivingAlerts(instructorId)
  │     └── calls get-driving-alerts edge function
  │           └── Returns: { alerts, currentWeather, location }
  │
  └── useInstructorLastPosition(instructorId)
        └── Returns: { roadName, latitude, longitude }
```

## Benefits

1. **At-a-glance context**: Instructors immediately see weather, location, and any warnings
2. **No extra API calls**: Current weather is already fetched by alerts function
3. **Compact design**: All info in existing tile, no additional scrolling
4. **Actionable**: Warnings help instructors plan their day better
