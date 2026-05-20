## public-courses audit — read end-to-end

You were right on all three framings. This isn't drift — `public-courses` never imported the engine; it's independent parallel logic that happens to answer an availability question. The grep hinted at one line; reading the whole file (and checking the schema) surfaced more, and the worst ones are absences. Reporting fix-by-fix below, then halting per your instruction.

### What this function actually decides

Given an instructor slug, it returns a course list and a single per-instructor field `nextAvailable` — a date string used on the public `/courses` page as "Next available: …". That date is the only availability decision it makes, but it's a high-trust one: it's the first availability number a pupil ever sees, before any booking funnel runs.

The decision is computed by `findFirstAvailableDate` (lines 22–65): walk 90 days from "today", skip dates before `available_from`, consult `instructor_date_overrides`, otherwise return the first day with any active `instructor_working_hours` row for that DOW.

### Findings (independent of grep — what's actually wrong when you read it)

**1. Server-local "today" is UTC, not London — silent off-by-one near midnight.** (lines 15–20, 27–28)
`new Date()` + `getFullYear/getMonth/getDate` on Deno Deploy = UTC. Between 00:00 and 01:00 BST (23:00–00:00 UTC the day before) the function's `today` is yesterday's London date. A pupil loading the page at 00:30 BST sees "Next available: [yesterday]" — which then fails validation when they click through, because the booking funnel uses `londonTodayStr`. **Parity break with the engine's canonical helper.** Same class of bug the engine's `londonDow` / `londonTodayStr` exists to prevent.

**2. DOW computed from UTC, not `londonDow`.** (line 38)
`day.getDay()` on a UTC-midnight Date. Symptom is rarer than #1 but same root cause: late Sunday in London (Sun 23:30 BST = Sun 22:30 UTC) is fine, but the construction is fragile and contradicts the codebase rule that DOW always comes from `londonDow`. Memory: `mem://constraints/availability-london-timezone`.

**3. `availability_paused` is never checked — absence.** (line 93 select list)
Schema confirms `instructors.availability_paused boolean` exists. A paused instructor is still publicly listed with a fabricated `nextAvailable` date. This is the public-discovery equivalent of "instructors on long break still publicly listed" that you flagged hypothetically — it's real, and it's worse than `available_from` drift because at least `available_from` is checked. `availability_paused` is invisible to this surface entirely.

**4. `min_lead_hours` ignored — "Next available: Today" with no bookable slots.** (line 30, today included unconditionally)
If an instructor's lead time is 24h and today is a working day, `nextAvailable` returns today. Pupil clicks through, sees zero slots. The engine's `minNoticeMinutes` gate is exactly what we just added to `create-booking` for parity. Same parity gap here, different surface.

**5. GCal events + manual blocks not consulted — contradicts the source-of-truth rule.** (no query for `instructor_calendar_events` / `instructor_manual_blocks`)
Per `mem://constraints/google-calendar-source-of-truth`, those two tables are the **only** sources of "instructor is busy." `public-courses` consults working-hours and date-overrides but never asks whether the day is actually busy. An instructor with a whole-day GCal event still shows that day as "next available." This is the largest behavioural gap on this surface, and again it's an absence — the grep table couldn't have flagged it.

**6. `available_from` check itself is correct but exists outside the engine.** (line 34)
String compare on ISO dates works. The problem isn't the logic; it's that it exists at all in this file. Same gate is in `create-booking` (now), in `availabilityCore`, and reimplemented here.

**7. Override `is_available = true` short-circuits return without checking working-hour times.** (lines 49–51)
Acceptable if "override with is_available=true" means "I'm working this whole day." If overrides can be partial-day with `is_available=true` and the rest of the day is blocked, this returns a misleading date. Lower priority — depends on override semantics elsewhere — but flagging because reading the file end-to-end raised it and the grep wouldn't have.

**8. `hoursToShow` defaults to `DISPLAY_HOURS` when instructor has no courses.** (lines 141–144)
Not an availability bug, but it means we publish "next available" dates for courses the instructor doesn't sell. Out of scope for this audit; noting for the brief.

### Reframe of the finding

`public-courses` makes **one** availability decision (`nextAvailable`) and gets **five** things wrong relative to the canonical engine: timezone, DOW source, pause flag, lead time, busyness source. Four of those are absences, not divergences. This matches your prediction: grep finds wrong checks; only reading finds missing ones.

It also confirms the structural point. This file was written before the engine existed (or in parallel with it), checks the same things differently, and there's nothing in the codebase that would have caught it. Fixing this one file doesn't fix the class.

### Two fix shapes, per your framing

- **Tactical (patch this surface):** five edits — switch to `londonTodayStr` + `londonDow`, add `availability_paused` filter at the SQL level, add `min_lead_hours` cutoff for today, query `instructor_calendar_events` + `instructor_manual_blocks` and skip days that are fully blocked. Keeps `findFirstAvailableDate` local. Lowest risk, doesn't touch the engine.
- **Structural (route through the engine):** call `computeDaySlots` (or a thin "is any slot bookable today?" wrapper) per day in the 90-day walk, return the first day that yields ≥1 slot. Deletes ~40 lines of parallel logic. Higher risk because `computeDaySlots` was built for a single-day query and a 90-iteration loop has cost/latency implications — needs measuring before commit.

I'd recommend **tactical now, structural as part of the durable-fix conversation** — because the structural option is the same conversation as the seventh-surface problem you raised, and shouldn't be decided one surface at a time.

### Halting here

Per your instruction: one surface, reported, reviewed, before the next. Not touching `smart-schedule-suggestions`, not drafting tests, not editing the brief, not writing code. Awaiting your call on which fix shape (or both, or neither yet) before any edits to this file.
