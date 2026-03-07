

# SOS Emergency Button System

## Overview

Add a red circular **SOS** button to the instructor mobile header that triggers a 3-tier emergency alert system. Each tier escalates visibility and includes the instructor's live GPS coordinates and what3words location.

## Database

**New table: `sos_alerts`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| instructor_id | uuid FK → instructors | Who triggered it |
| alert_level | text | `call_me`, `help`, `sos` |
| latitude | numeric | From browser geolocation |
| longitude | numeric | |
| what3words | text | Resolved via existing edge function |
| message | text | Auto-generated based on level |
| resolved_at | timestamptz | Null until resolved |
| created_at | timestamptz | |

Enable realtime on this table so admin and other instructors receive instant alerts.

RLS: Instructors can insert their own alerts. Admins can read all. Instructors can read `sos`-level alerts (for the "all local instructors" broadcast).

## Components

### 1. SOS Button in Header (`InstructorMobileHeader.tsx`)

A small red circular button with "SOS" text, placed in the right-side action buttons area (before the bell icon). Tapping opens a bottom sheet / dialog.

### 2. SOS Dialog (`SOSEmergencySheet.tsx`)

A full-screen overlay with 3 large, clearly-tappable options:

- **"Please Call Me"** (amber) — sends alert to admin + driving school owner. Message: "[Name] is requesting a callback."
- **"Help — Call Me ASAP"** (orange) — elevated urgency alert to admin + school owner. Message: "[Name] needs urgent assistance."
- **"SOS — Emergency"** (red, pulsing) — highest severity, alerts admin + school owner + all local instructors via the existing `urgent_alerts` table broadcast. Message: "[Name] has triggered an SOS emergency."

Each option:
1. Captures current GPS position via `navigator.geolocation.getCurrentPosition()`
2. Calls the existing `convert-to-what3words` edge function (passing coords, not postcode — will need a small update to accept lat/lng directly)
3. Inserts into `sos_alerts` table
4. For SOS level: also inserts a broadcast `urgent_alert` so all instructors see the existing red overlay
5. Shows confirmation with "Help is on the way" message

### 3. Admin SOS Alert Panel

Add an SOS alerts section to the admin dashboard that shows active SOS alerts with:
- Instructor name, alert level, time
- GPS coordinates as a clickable Google Maps link
- what3words link
- "Resolve" button

### 4. Edge Function Update

Update `convert-to-what3words` to also accept `{ latitude, longitude }` directly (currently only accepts postcode). This allows converting live GPS coordinates to what3words without needing a postcode.

## Technical Flow

```text
Instructor taps SOS → Dialog opens → Selects level
  → Browser gets GPS coords
  → Calls convert-to-what3words with lat/lng
  → Inserts into sos_alerts (with coords + w3w)
  → If SOS level: also inserts urgent_alerts broadcast
  → Shows confirmation
  → Admin sees alert in dashboard (realtime)
  → SOS-level: all instructors see urgent alert overlay
```

## Files to Create/Edit

1. **Create** `src/components/instructor/SOSEmergencySheet.tsx` — the 3-option dialog
2. **Edit** `src/components/instructor/InstructorMobileHeader.tsx` — add SOS button
3. **Edit** `supabase/functions/convert-to-what3words/index.ts` — accept lat/lng input
4. **Create** `src/components/admin/SOSAlertsPanel.tsx` — admin view of active SOS alerts
5. **Migration** — create `sos_alerts` table with RLS + realtime

