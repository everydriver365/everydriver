# Fix: Google Calendar showing DSM lessons 1 hour late (BST/DST issue)

## Root cause

`supabase/functions/instructor-calendar-feed/index.ts` emits lesson `DTSTART` / `DTEND` as **floating local times** (no `Z`, no `TZID`, no `VTIMEZONE` block).

RFC 5545 says floating times should render in the viewer's local timezone — but Google Calendar's URL-subscription parser is well known to treat floating `DTSTART` as **UTC** when there's no `VTIMEZONE` block. Result: during BST (UTC+1) every lesson appears 1 hour later than it should. In winter (GMT) it would appear correct, which is why the bug is DST-specific.

Manual blocks are emitted with `Z` (UTC instants) and are correct.

## Fix

Make the feed explicit about Europe/London so Google, Apple, and Outlook all render the right wall-clock year-round.

1. **Add a `VTIMEZONE:Europe/London` block** to the VCALENDAR with both `STANDARD` (GMT, last Sunday October, +0000) and `DAYLIGHT` (BST, last Sunday March, +0100) sub-components with `RRULE` so it's valid forever.
2. **Lesson VEVENTs**: emit `DTSTART;TZID=Europe/London:YYYYMMDDTHHMMSS` and the same for `DTEND` (no `Z`). Wall-clock value comes straight from `lesson_date` + `start_time` (+ `duration_minutes`) — no UTC conversion needed because the DB stores London civil time already.
3. **Manual blocks**: keep current UTC `Z` output — `start_datetime` / `end_datetime` are `timestamptz`, so UTC is correct.
4. Drop the `toIcsFloating` helper's role for lessons; reuse it to produce the local wall-clock string but pair it with the `TZID` parameter.
5. Bump `PRODID` minor version so Google treats the feed as updated and re-reads VTIMEZONE on next poll.

No DB changes. No inbound poller changes (it already handles `TZID=Europe/London` correctly via `londonOffsetMinutes`).

## Files touched

- `supabase/functions/instructor-calendar-feed/index.ts` — only file.

## Verification

- Curl the feed URL after deploy and confirm it contains a `BEGIN:VTIMEZONE` block and `DTSTART;TZID=Europe/London:` lines for lessons.
- Re-subscribe (or wait for Google's poll, ~1–3h) and confirm a known 10:00 BST lesson shows at 10:00, not 11:00.
- Spot-check a December lesson (GMT) still shows at the correct time.
