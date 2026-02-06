

# Add National Highways Road Alerts to Plan Ahead Section

## Overview
Integrate the free National Highways (formerly Highways England) API into the existing driving alerts system. Road alerts (closures, roadworks, incidents) near the instructor will appear as compact rows in the **PLAN AHEAD** section -- only when relevant to their location.

## How it works

1. The existing `get-driving-alerts` edge function already resolves the instructor's lat/lng from their home postcode. We add a new API call to the National Highways DATEX II events endpoint, filtering results by proximity (within ~15 miles).

2. A new `"road"` alert type is added alongside the existing `"weather"` and `"traffic"` types. Each road alert includes the road name (e.g. "M27"), a short description, severity, and source attribution.

3. On the frontend, a small new component in the Plan Ahead section renders only National Highways road alerts (roadworks, closures) as discreet rows with an orange/red construction icon -- similar in size to the existing "Nothing upcoming" row. These only render when there are relevant alerts for the instructor's area.

## Changes

### 1. Edge Function: `supabase/functions/get-driving-alerts/index.ts`
- Add a fetch to `https://api.nationalhighways.co.uk/roads/events` (free, no API key required for basic DATEX II)
- Filter returned events by distance from instructor's lat/lng (within ~25km / 15 miles)
- Map events to a new `RoadAlert` type with fields: `type: "road"`, `severity`, `title` (road name + event type), `description`, `roadName`, `icon: "Construction" | "Ban"`
- Merge into the existing `alerts` array before returning

### 2. Type update: `src/hooks/useDrivingAlerts.ts`
- Extend the `DrivingAlert` interface `type` field to include `"road"` alongside `"weather" | "traffic"`

### 3. Frontend: `src/components/instructor/InstructorMobileHome.tsx`
- Filter road alerts from the existing `alerts` array (already fetched by `useDrivingAlerts`)
- Render them as compact rows in the Plan Ahead section (below the Tomorrow Peek card, above the setup checklist)
- Each row: small icon + road name + short description + chevron (tappable, links to a map or dismisses)
- Only shown when there are road-type alerts; otherwise nothing renders

## Technical details

- The National Highways API base URL is `https://api.nationalhighways.co.uk/` -- the events/unplanned endpoint returns JSON with incident location coordinates
- Distance filtering uses the Haversine formula (already used elsewhere in the codebase) to keep only events within ~25km of the instructor
- Results are cached alongside existing weather/traffic alerts (same 10-minute cache)
- The API is free and does not require an API key for basic access
- Only "moderate" and "severe" severity road alerts are shown (matching existing filter logic)

