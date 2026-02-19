
# Trip Investigation and Report Generation

## Overview

Add the ability to click on any trip in the Trips tab to open a detailed investigation view, and generate per-trip reports covering distance, speed behaviour, idle time, and driving patterns.

## Current State

- The Trips tab shows a sortable table of trips with date, time, distance, duration, max speed, and idle time
- Clicking the play button navigates to `/instructor/trip-replay` but only works when `startLat`/`startLng` are available (currently most trips have `null` start coordinates)
- The Reports tab only generates a basic CSV export of all trips in a date range
- There is no way to drill into a single trip's details or generate a per-trip behaviour report

## What Will Change

### 1. Trip Detail Sheet (click any row)

Clicking a trip row in the table will open a slide-up bottom sheet (using the existing `vaul` Drawer) showing:

| Section | Content |
|---------|---------|
| **Header** | Date, time range, device name |
| **Summary Cards** | Distance (mi), Duration, Avg Speed (mph), Max Speed (mph), Idle Time, Stop Time |
| **Behaviour Score** | A simple calculated score based on max speed vs avg speed ratio, idle percentage, and stop time -- displayed as a colour-coded badge (Green/Amber/Red) |
| **Speed Analysis** | Bar showing avg vs max speed with context ("Max speed was 2.1x average -- indicates sharp acceleration periods") |
| **Idle Analysis** | Percentage of trip spent idling with commentary |
| **Actions** | "Replay Trip" button, "Generate PDF Report" button, "Download CSV" button |

### 2. Per-Trip PDF Report

A downloadable PDF (using the existing `jspdf` dependency) containing:
- Trip summary (date, distance, duration, speeds)
- Driver behaviour assessment (speed consistency, idle ratio, stop frequency)
- A simple scoring rubric
- Branding header with "EveryDriver" logo text

### 3. Enhanced Trip Row

Each trip row becomes clickable (full row, not just the play button). The play button remains for quick replay access.

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/instructor/geotab/TripDetailSheet.tsx` | Drawer/sheet showing trip investigation with behaviour analysis and report generation |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/instructor/geotab/GeotabTripHistory.tsx` | Make entire row clickable to open `TripDetailSheet`; add selected trip state |

### Behaviour Score Calculation

The score will be computed client-side from existing trip data (no new API calls needed):

- **Speed consistency**: `avgSpeed / maxSpeed` ratio -- higher is better (steady driving)
- **Idle ratio**: `idleMinutes / durationMinutes` -- lower is better
- **Overall**: Weighted combination mapped to Green (70-100), Amber (40-69), Red (0-39)

Trips with zero distance or zero duration will show "Insufficient data" instead of a score.

### PDF Generation

Uses the already-installed `jspdf` package to create a single-page PDF with:
- Header with date and vehicle name
- Summary table (distance, duration, speeds, idle)
- Behaviour assessment text
- Score badge

No new edge functions or API calls are required -- all data is already available from the trip object.
