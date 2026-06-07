## What I found

- The lessons expected around **8–12 June** are not hidden by the favicon/logo changes. In the live database, nearly all rows for that week are already marked `status = cancelled` and/or `deleted_at` is set, mostly with reason **“Pupil deleted”** and `cancelled_by = instructor`.
- The visible active lesson for that week is **Monday 8 June, 11:30, Soraya**, created today.
- The “random” late-night lessons are actual lesson rows:
  - Joseph Thorne: stored as **2026-06-28 01:30**, created **19 May**, now completed.
  - Soraya: stored as **2026-07-05 01:30**, created **31 May**, currently scheduled.
- Because the calendar sync/display code builds dates with `new Date(...)` and then sends/reads ISO UTC timestamps, **01:30 London can appear as the previous day late evening** in some views/sync outputs. That explains why they can surface as **27 June 22:30** and **4 July 23:30** style entries.

## Plan

1. **Fix lesson date/time construction**
   - Replace unsafe `new Date(`${lesson_date}T${start_time}`)` usage for lesson rows with explicit Europe/London/local-clock parsing helpers.
   - Apply this in:
     - `src/hooks/useInstructorCalendar.ts`
     - `src/hooks/useScheduleWeek.ts`
     - `supabase/functions/_shared/googleCalendarSync.ts`
   - This prevents lesson-only rows from shifting day/time when displayed or synced.

2. **Make schedule queries exclude soft-deleted lessons consistently**
   - Add `deleted_at IS NULL` to schedule/calendar lesson queries that currently only exclude `status = cancelled`.
   - This avoids cancelled/deleted lessons leaking into UI paths if the status and soft-delete flags drift.

3. **Stop repeated sync loops for already-synced rows**
   - Review the trigger/queue behavior that repeatedly enqueued the June 28 and July 5 rows today.
   - Adjust only if needed so unchanged lessons are not re-pushed over and over.

4. **Data correction needs your approval before I change live data**
   - I will not mutate live lesson rows without your go-ahead.
   - Once the code fix is approved, I can separately restore specific cancelled lessons for **Mon 8 / Tue 10 / Fri 12 June** and remove or cancel the two unwanted late-night rows, but I need you to confirm the exact lessons/times to restore/remove.

## Technical notes

- No evidence links the favicon/logo edits to lesson deletion.
- The risky pattern is date parsing/timezone conversion, especially `new Date(dateString)` / `new Date(lesson_date + 'T' + start_time)` followed by `.toISOString()`.
- Calendar availability source rules remain unchanged: Google Calendar mirror + manual blocks are the busy source; `scheduled_lessons` remains CRM data.