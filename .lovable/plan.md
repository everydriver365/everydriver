# Upcoming Events – Today button + Event Details page

## 1. Add "Today" button to the tile

File: `src/components/instructor/UpcomingEventsTile.tsx`

In the calendar strip header (between the prev/next chevrons and the month label), add a small "Today" pill button. It is only visible when the visible week strip does not already include today (`!visibleDays.some(d => isSameDay(d, today))`). Clicking sets `stripStart` back to `subDays(startOfDay(new Date()), 4)` so today appears centred again — matching the initial state.

Style: same `stripBtn` pattern, but auto width with `padding: "0 10px"`, font 10/700, color `#1A52A0`, background `#EEF3FF`. Place it next to the month label.

## 2. Event details page

New route: `/instructor/events/:eventKey`

`eventKey` is the existing `UpcomingEvent.id` (e.g. `dt-<pupilId>`, `tt-<pupilId>`, `mot-<vehicleId>`, `ins-<vehicleId>`, `todo-<id>`, `cpd-<id>`, `block-<id>`). The prefix tells the page how to fetch the source record.

New file: `src/pages/InstructorEventDetails.tsx`
- Parses the prefix, fetches the matching row from the appropriate table (`pupils`, `instructor_vehicles`, `instructor_todos`, `cpd_log_entries`, `instructor_manual_blocks`).
- Renders a mobile detail screen using existing portal styling (white card on `#F2F4F8`, back chevron header showing event type label):
  - Title, date + time, location/description, related entity link (e.g. "Open pupil profile", "Open vehicle health").
  - For CPD / manual blocks / training that have a `meeting_url` (Zoom/Teams/Meet), show a primary "Join meeting" button that opens the link in a new tab. Detect provider from URL host (`zoom.us` → "Join Zoom", `teams.microsoft.com` → "Join Teams", else "Join meeting"). Show muted host text underneath.
  - Secondary actions: "Open in Schedule" (navigates `/instructor/schedule`), and for tasks "Mark complete" (existing todo update if trivially possible — otherwise just deep-link to `/instructor/todos`).

Meeting URL sources:
- `cpd_log_entries`: add optional read of `meeting_url` if column exists; fall back to scanning `description`/`notes`/`provider` for a URL via regex.
- `instructor_manual_blocks`: same — read `meeting_url` if present, else regex over `title`/`notes`.
- `instructor_calendar_events` already has `meeting_url` (per migration 20260417). Manual blocks added via the Add event dialog may write here; if so, use it directly.

No schema changes required; if the column is missing on a table the read is wrapped in try/catch and the URL regex fallback covers it.

## 3. Wire navigation

File: `src/components/instructor/UpcomingEventsTile.tsx`

Change the row click handler from `navigate(e.destinationPath)` to `navigate(\`/instructor/events/\${e.id}\`)`. Keep `destinationPath` on the event model — the details page uses it as the "Open related" deep link.

File: `src/App.tsx` (or wherever instructor routes live — verify with `rg "instructor/schedule" src/App.tsx`)
Add: `<Route path="/instructor/events/:eventKey" element={<InstructorEventDetails />} />`.

## Out of scope

- No changes to data fetching in `useUpcomingEvents` beyond exposing `meeting_url` if trivial.
- No new tables, no Zoom API integration — "join" is just opening the stored URL.
- Mobile-only styling; matches existing instructor portal tokens.
