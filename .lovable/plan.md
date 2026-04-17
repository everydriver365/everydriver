

## Why details are missing

The "WDU" event row in our DB has `description = NULL`, `location = NULL` — confirmed via DB query. The Zoom info on the original Google event lives in **Google's `conferenceData` object** (and possibly `hangoutLink`), which our sync **does not request or store**. Plain `description` is also empty for this particular event because the organiser put the Zoom link only into the conferencing block, not the body.

So the panel correctly shows "No additional details" — the sync simply never captured the meeting link.

## Plan

### 1. Sync — capture conference + link fields
`supabase/functions/google-calendar-service/index.ts`:
- Add `conferenceDataVersion=1` to the Google list params and request the extra fields (`fields=...,items(conferenceData,hangoutLink,htmlLink,attendees)`).
- Extract:
  - `meeting_url` — first of `conferenceData.entryPoints[].uri` where `entryPointType=video`, fallback to `hangoutLink`, fallback to first URL found in `description`.
  - `meeting_provider` — `conferenceData.conferenceSolution.name` (e.g. "Zoom Meeting", "Google Meet").
  - `html_link` — `htmlLink` (link back to the Google event).
- Save them on insert/upsert.

### 2. DB — add columns
Migration: add to `instructor_calendar_events`:
- `meeting_url text`
- `meeting_provider text`
- `html_link text`

### 3. UI — render meeting link in the expanded panel
`src/components/instructor/MultiDayScheduleView.tsx` (both expansion blocks ~lines 470–490 and 620–640):
- Select the new fields.
- When `meeting_url` exists → show a primary "Join {provider}" button (e.g. "Join Zoom Meeting") that opens the URL in a new tab.
- Always show an "Open in Google Calendar" link if `html_link` exists.
- Keep "No additional details" only when description, location, and meeting_url are all empty.

### 4. Re-sync trigger
After deploy, the next scheduled sync will backfill the new fields. Add a one-shot manual "Sync now" call note for the user (no code needed — they already have the Sync button in calendar settings).

### Files
- EDIT `supabase/functions/google-calendar-service/index.ts` — request + capture conference fields.
- NEW migration — add 3 columns.
- EDIT `src/components/instructor/MultiDayScheduleView.tsx` — render meeting link / Google Calendar link.

