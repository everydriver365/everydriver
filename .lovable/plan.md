
# Traffic & Weather Alerts for Instructor Home

## Overview
Add a contextual alert strip to the instructor home page that displays real-time weather conditions and traffic incidents affecting their teaching area. This will help instructors plan their lessons more effectively by warning about adverse conditions.

---

## What You'll Get

### Weather Alerts
- Current temperature and conditions for your area
- Warnings for adverse weather (heavy rain, ice, fog, snow)
- Visibility and wind speed warnings relevant to driving lessons

### Traffic Alerts  
- Real-time traffic incidents near your location
- Road closures and delays on common routes
- Estimated impact on lesson times

### Smart Integration
- Alerts appear between the motivational card and Smart Reminders
- Colour-coded by severity (amber for moderate, red for severe)
- Dismissible for the day if not relevant
- Only shows when there's something noteworthy

---

## How It Will Look

The alerts will appear as compact, tappable cards below the hero section:

```text
┌─────────────────────────────────────────────┐
│  ☁️ 8°C Overcast • Light rain expected      │
│     Visibility: 5km • Wind: 15 mph          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🚧 Traffic Alert: A406 Roadworks           │
│     20 min delay • Finchley Road area       │
└─────────────────────────────────────────────┘
```

---

## Data Sources

### Weather (Free API - No Key Needed)
- **Open-Meteo API**: Completely free, no API key required
- Provides current conditions, hourly forecasts, and weather codes
- Excellent for UK weather with high accuracy

### Traffic (Using Existing Key)
- **TomTom Traffic API**: You already have `TOMTOM_API_KEY` configured
- Provides real-time incident data within a radius
- Includes delays, roadworks, closures, and accidents

---

## Technical Implementation

### 1. New Edge Function: `get-driving-alerts`
Creates a backend function that:
- Geocodes the instructor's `home_postcode` to coordinates
- Fetches weather from Open-Meteo (free, no key)
- Fetches traffic incidents from TomTom (using existing key)
- Returns combined, filtered alerts

### 2. New Database Columns
Adds to `instructors` table:
- `lat` (numeric) - Cached latitude for postcode
- `lng` (numeric) - Cached longitude for postcode

### 3. New Hook: `useDrivingAlerts`
A React hook that:
- Calls the edge function periodically (every 10 minutes)
- Caches results to prevent excessive API calls
- Filters alerts based on severity thresholds
- Handles loading and error states

### 4. New Component: `DrivingAlertsStrip`
A mobile-optimised alert strip that:
- Shows weather conditions with temperature and icon
- Lists nearby traffic incidents with severity
- Uses compact, horizontal layout following existing UI standards
- Supports dismiss functionality

### 5. Integration into Home Page
- Placed in `InstructorMobileHome.tsx` after the motivational card
- Only renders when there are noteworthy conditions
- Follows the same motion animations as other elements

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/get-driving-alerts/index.ts` | Edge function for weather + traffic API calls |
| `src/hooks/useDrivingAlerts.ts` | React hook for fetching and caching alerts |
| `src/components/instructor/DrivingAlertsStrip.tsx` | UI component for displaying alerts |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/instructor/InstructorMobileHome.tsx` | Import and render DrivingAlertsStrip |
| Database migration | Add lat/lng columns to instructors table |

---

## Alert Threshold Logic

### Weather Triggers
- Temperature below 3°C (ice risk)
- Rain probability > 60%
- Wind speed > 25 mph
- Visibility < 2km
- Weather codes for snow, fog, thunderstorm

### Traffic Triggers
- Incidents within 10km of instructor
- Delay > 10 minutes
- Severity: Major or Moderate
- Types: Accident, roadworks, closure, congestion

---

## Cost Considerations

- **Open-Meteo**: Completely free, unlimited calls
- **TomTom**: Already configured; Traffic API has generous free tier (2,500 requests/day)
- Caching ensures minimal API usage (1 call per instructor per 10 mins max)

---

## Mobile UI Standards Applied

Following existing patterns:
- Compact card with gradient background based on alert type
- Icon-first layout with minimal text
- Horizontal scrolling if multiple alerts
- Uses existing colour tokens (amber for warnings, red for severe)
- Respects dark/light mode theming
