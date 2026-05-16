## What's actually wrong with Ken D

I pulled his record. The selector isn't broken — his profile has two settings that together hide every slot:

### 1. `available_from = 2026-06-01` (today is 16 May 2026)
This is a hard gate. `courseAvailability.ts` (lines 303 + 446) and other booking surfaces refuse every date before `available_from`. Until June 1 he will show **zero** slots on every pupil-facing surface, regardless of working hours. This was set in his Availability settings (the "Available from" date field) — almost certainly by accident.

### 2. Two parallel "weekly hours" tables that drift apart
Ken has rows in **`instructor_working_hours`** (Mon–Fri 10:30–16:00, Sat/Sun 07:00–12:00) but **`availability_windows` is empty**.

The codebase has two editors and two tables for the same concept:

| Editor | Writes to | Read by |
|---|---|---|
| `WorkingHoursEditor` (settings → Availability) | `instructor_working_hours` | gap slots, pupil portal, scheduler, WhatsApp, auto-scheduler, etc. |
| `AvailabilityWindowsManager` (older flow) | `availability_windows` | `useScheduleWeek`, `Courses.tsx`, `useAvailabilityData` (the new settings hook), course availability engine |

`courseAvailability.ts` unions both, so Ken's `instructor_working_hours` keeps most things alive — but anything reading **only** `availability_windows` (notably `useAvailabilityData`, which powers parts of the new settings/availability page) will show him as having no hours. That's the "fixed it but still empty" feeling.

## The fix — two parts

### Part A — Unblock Ken right now (data fix, ~1 min)
1. Clear his `available_from` (set to `NULL`).
2. Backfill `availability_windows` from `instructor_working_hours` so both tables agree for him.

After this his availability returns immediately. I'll verify by re-running the gap-slot query for the next 14 days before claiming done.

### Part B — Stop this happening again (small code + schema work)

1. **Make `WorkingHoursEditor` dual-write** to both `instructor_working_hours` and `availability_windows` in one transaction (keyed by `instructor_id` + `day_of_week`, replacing the day's rows). Same for the legacy `AvailabilityWindowsManager`.
2. **Backfill once** with a migration that copies missing rows in either direction for all instructors so existing accounts are consistent.
3. **Add a guard in the Availability settings page** so saving `available_from` with a date >14 days in the future shows a confirmation ("Pupils won't see any availability until {date} — are you sure?"). This is the trap Ken fell into.
4. **Add an instructor-side "Why am I not showing up?" diagnostic** on the Availability page that runs the same checks the booking engine runs (available_from in future? no working hours? everything blocked by time-off?) and shows the first failing reason in plain English.

Step 4 is the long-term answer — instructors self-diagnose instead of bouncing back to support.

### Out of scope for this change
- Merging the two tables into one (bigger refactor — every consumer in the table above would need touching; happy to plan separately).
- Touching mobile layouts (per project rule).
- Any change to the booking/clash engine logic itself.

## Order of work
1. Data fix for Ken (clear `available_from`, backfill his `availability_windows`) — verify availability returns.
2. Dual-write in both editors + one-shot backfill migration.
3. Future-date confirmation on `available_from`.
4. Self-diagnostic panel on the instructor Availability page.

Want me to do **just step 1** so Ken is live today, then do 2–4 as a follow-up — or all four in one go?