## Audit result: why lessons appear, disappear, or move

No live data was changed during this audit.

### 1. Current live-data state

For the affected instructor, the database currently does not have a clean matching set between DSM lessons and Google calendar events.

**Active DSM lessons found for the immediate week:**

- Tue 9 Jun — Soraya Morriss-Manosalva — one active DSM lesson, linked to Google.
- Joseph’s 9 Jun and 12 Jun lessons are not active DSM lessons; they exist as Google-only events.
- Mon 8 Jun “Lesson : Soriya” exists as a Google-only event, not a booked DSM lesson.

**Google-only lesson-looking events found:**

- Mon 8 Jun 10:30 London — “Lesson : Soriya”
- Tue 9 Jun 10:30 London — “Lesson : Joseph”
- Fri 12 Jun 10:30 London — “Lesson : Joseph”

These are sitting in the unmatched Google events flow. They can block availability and appear in calendar/schedule-style views, but they are not full DSM lesson records until explicitly matched to a pupil.

### 2. The main root cause: calendar time drift

There is a real sync bug in the Google Calendar push/pull code.

DSM stores lesson time as:

```text
lesson_date = 2026-06-09
start_time  = 10:30:00
```

Google calendar events are stored as full timestamps:

```text
2026-06-09T09:30:00+00:00
```

That is correct for a 10:30 UK summer-time event.

However, the sync function builds a JavaScript `Date`, converts it to UTC with `.toISOString()`, and then sends it to Google while also saying `timeZone: Europe/London`.

That combination is wrong during BST. It causes the event to be interpreted again as a London local time, so each sync cycle can move the lesson by +1 hour.

During the audit, the linked Soraya DSM row moved again while the sync was running. That proves this is not just stale UI and not user error.

### 3. Why lessons appear then disappear

There are three unsafe sync patterns:

#### A. Full delete + reinsert of Google mirror rows

The Google fetch path currently deletes all mirrored calendar events for an instructor, then reinserts the fetched events.

For a short period the mirror table is empty.

If another reconcile process runs in that gap, it can conclude that linked Google events were deleted and then cancel matching DSM lessons.

That is the highest-risk “lesson disappears” mechanism.

#### B. Reconcile treats missing mirror rows as deleted Google events

The webhook reconcile code says:

```text
If a DSM lesson has google_event_id
and that id is not currently in the mirrored Google events table
then cancel the DSM lesson.
```

That is dangerous when the mirror table can be temporarily empty, stale, mid-refresh, or filtered to a narrow date range.

#### C. Range resync can cancel lessons outside its window

The range resync logic diffs a selected time window. If a Google event moves outside that window, or a timezone conversion puts it outside the window, the code can treat it as removed and soft-cancel the DSM lesson.

### 4. Why Home, Schedule, and pupil records disagree

Different screens are not using the same source of truth.

**Home next lesson tile**

- Reads DSM `scheduled_lessons` only.
- Ignores Google-only unmatched events.
- Filters out cancelled lessons and deleted pupils.

**Schedule / calendar views**

- Some schedule views merge DSM lessons, Google mirror events, and manual blocks.
- That means a Google-only event can appear in schedule even when no DSM lesson exists.
- It can also show duplicated or shifted entries when the Google mirror and DSM row disagree.

**Pupil record**

- The pupil lesson-history hook reads completed entries from `lesson_history`.
- Upcoming lessons are read from `scheduled_lessons` only in views that request upcoming records.
- Past scheduled lessons without a matching `lesson_history` row are silently dropped.

For Joseph and Soraya, the audit found no `lesson_history` rows linked to the relevant scheduled lessons. That explains why pupil records can look empty even when schedule rows exist.

### 5. Sync queue evidence

Today there were 1,280 `syncLesson` queue entries for this instructor.

That is not normal. It means the system has been repeatedly reprocessing the same lesson/calendar rows.

This repeated processing matches the observed behaviour:

```text
lesson appears
sync runs
Google mirror changes
DSM row updates or cancels
screen refetches
lesson moves or disappears
```

### 6. What I will not do without approval

I will not randomly add or delete lessons.

I will not restore cancelled lessons.

I will not create DSM rows from Google-only events.

I will not touch pupil balances, payments, lesson history, or financial records.

### Stabilisation plan

#### Step 1 — Stop time drift

Fix the Google sync time conversion so DSM local lesson times are sent to Google as proper Europe/London wall-clock times, not UTC ISO strings relabelled as London time.

Affected code:

- `supabase/functions/_shared/googleCalendarSync.ts`
- `supabase/functions/google-calendar-service/index.ts`

Expected result:

- A 10:30 DSM lesson stays 10:30 in Google.
- Fetching it back from Google does not update DSM to 11:30, 12:30, etc.

#### Step 2 — Stop destructive reconcile races

Change Google fetch/reconcile behaviour so the mirror table is not treated as destructive truth while it is being refreshed.

Specifically:

- Replace full delete + reinsert with safer upsert-and-prune logic.
- Do not cancel DSM lessons just because a linked event is missing from a temporarily refreshed mirror table.
- Only cancel a DSM lesson from Google deletion when the absence is confirmed from a fresh Google API result, not from an empty/stale mirror table.

Affected code:

- `supabase/functions/google-calendar-service/index.ts`
- `supabase/functions/google-calendar-webhook/index.ts`
- `supabase/functions/reconcile-google-calendar/index.ts`

#### Step 3 — Make Schedule and Home consistent

Keep DSM lessons as the business source of truth.

Schedule can still show Google-only events as busy blocks, but it must not make them look like booked DSM lessons.

Actions:

- Deduplicate Google mirror events when their `external_event_id` is already linked to a DSM lesson.
- Add missing `deleted_at is null` filters to lesson schedule queries.
- Keep Google-only events visually separate as “Google event / unmatched”, not as normal lessons.

Affected code:

- `src/hooks/useInstructorCalendar.ts`
- `src/hooks/useScheduleWeek.ts`
- `src/hooks/useDayLessons.ts`
- `src/hooks/useTomorrowLessons.ts`
- `src/hooks/useTomorrowPreview.ts`

#### Step 4 — Fix pupil record visibility

Update pupil record lesson loading so lessons do not silently vanish.

Actions:

- Show upcoming DSM scheduled lessons in pupil records where expected.
- Surface past scheduled lessons without `lesson_history` as “needs end-of-lesson record” instead of hiding them.
- Do not invent lesson history rows.

Affected code:

- `src/hooks/usePupilLessonHistory.ts`
- Pupil record components that render the lessons tab/profile summary.

#### Step 5 — Read-only verification report

After code stabilisation, run a second read-only audit for the affected dates and produce a precise list:

```text
Date / time
Pupil
DSM row state
Google event state
Linked / unmatched / cancelled
Recommended action
```

#### Step 6 — Only then repair live data if approved

Once the sync logic is safe, ask for explicit approval before any live data repair.

Possible repair actions would be listed one by one, for example:

- Create DSM lesson from Google-only Joseph 9 Jun 10:30.
- Create DSM lesson from Google-only Joseph 12 Jun 10:30.
- Ignore or dismiss Google-only “Lesson : Soriya” if it was never booked.
- Correct any shifted Soraya/Joseph DSM row times back to the intended time.

No repair would run without explicit approval.