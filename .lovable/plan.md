## What's actually happening

The "Lesson : Joseph" 10:30 on Tue 9 Jun that you see on the **Schedule** page and in Google Calendar is **not** a DSM lesson — it only exists as a Google Calendar event (`instructor_calendar_events`, external id `…`, title "Lesson : Joseph", 10:30–11:30, yellow/colorId).

I confirmed in the database:
- `scheduled_lessons` for you on 2026-06-09 → all rows are `status=cancelled` (the 19 May batch). No active DSM lesson exists for Joseph that day.
- `instructor_calendar_events` for 2026-06-09 → contains "Lesson : Joseph" as a Google event with no matching DSM lesson.

That's why it shows on:
- **Schedule page** → merges DSM lessons **and** Google Calendar events (busy mirror)
- **Google Calendar** → it's a native event there

…but not on:
- **Home page** ("Next Up", Today, Tomorrow tiles) → these query **only** `scheduled_lessons` (CRM data). Per project rule, GCal is the busy source, `scheduled_lessons` is the CRM/lesson source — the home tiles deliberately don't show raw GCal events because they have no pupil link, payment, duration logic, earnings, etc.

So this isn't a bug in code I changed — it's the documented separation between "Google calendar busy events" and "DSM lessons". The Joseph event was created directly in Google (or imported as a calendar event), never booked through DSM.

## Options — pick one

**Option A — One-off fix: create the DSM lesson for Joseph (recommended)**
Create a proper `scheduled_lessons` row for Joseph Thorne, Tue 9 Jun 10:30, 60 min, linked to the existing Google event id so it doesn't duplicate. Home tiles will then show it. No code changes.

**Option B — Restore the 9 Jun cancelled Joseph row (if one of the 19 May cancellations was his 10:30)**
Find the cancelled Joseph row on 9 Jun 10:30, un-cancel it (`status=scheduled`, clear `deleted_at`), and relink to the existing GCal event id. Same outcome as A but reuses the original row/history. No code changes.

**Option C — Code change: show "Google-only" lesson-like events on Home**
Detect GCal events whose title matches `Lesson : <pupil>` (or any GCal event the instructor flags) and surface them on Home tiles alongside DSM lessons. Bigger change — affects Next Up, Today, Tomorrow, weekly stats. Comes with caveats: no pupil id, no payment status, no earnings, can't tap-to-message pupil, can produce duplicates when the same lesson is later booked properly in DSM.

**Option D — Do nothing**
Keep Home as DSM-only. Treat Google-only "Lesson : …" events as personal/manual entries, and always create real lessons through DSM if you want them on Home.

## My recommendation

Option A or B. The current split (DSM = home, GCal = busy/schedule overlay) is a deliberate architectural rule in this project and Option C would erode it. Tell me which option, and for A/B confirm the pupil (Joseph Thorne) so I can write the migration.