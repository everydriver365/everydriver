
# Improve Weather Alerts Readability & Location Display

## Overview
Enhance the driving alerts to be more readable and include the location name (area/town) so instructors know exactly where the weather report is for.

---

## What Will Change

### 1. Location Display
- Show area name (e.g., "Finchley", "Camden Town") derived from the postcode
- Display at the top of weather alerts so it's immediately clear where the forecast is for

### 2. Better Readability  
- Clearer typography hierarchy
- Temperature displayed more prominently
- Condition text simplified and easier to scan
- Location name shown in a subtle badge

---

## Visual Preview

**Before:**
```text
┌──────────────────────────────────────┐
│ 🌡️ WEATHER              SEVERE      │
│ 2°C - Ice Risk                      │
│ Near freezing. Watch for ice...     │
└──────────────────────────────────────┘
```

**After:**
```text
┌──────────────────────────────────────┐
│ 📍 Finchley   WEATHER               │
│ 🌡️ 2°C - Ice Risk                   │
│ Near freezing. Watch for ice...     │
└──────────────────────────────────────┘
```

---

## Technical Changes

### Backend (Edge Function)
Add location name retrieval from postcodes.io geocode response and include it in the API response.

**File:** `supabase/functions/get-driving-alerts/index.ts`
- Extract `admin_district` or `ward` from the geocode response
- Add `location` field to the returned data
- Cache the location name alongside lat/lng

### Data Layer (Hook)
Update the hook to capture and expose the location name.

**File:** `src/hooks/useDrivingAlerts.ts`
- Add `location` to the return type
- Include location in cache structure
- Pass location through to the UI

### UI Component
Enhance the alert cards for better readability with location context.

**File:** `src/components/instructor/DrivingAlertsStrip.tsx`
- Add location prop
- Display location badge at top of weather alerts
- Improve typography: larger title, better spacing
- Add MapPin icon for location indicator

---

## Database Change
Add `location_name` column to the `instructors` table to cache the area name (avoids repeated geocoding calls).

---

## Summary of Files

| File | Change |
|------|--------|
| `supabase/functions/get-driving-alerts/index.ts` | Return location name from geocode |
| `src/hooks/useDrivingAlerts.ts` | Expose location in hook return |
| `src/components/instructor/DrivingAlertsStrip.tsx` | Display location + improve readability |
| Database migration | Add `location_name` column to instructors |
