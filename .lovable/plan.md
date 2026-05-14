# EveryDriver Availability & Booking — Read-Only Audit

No code changed. Findings only, mapped to the four parts of your request.

---

## Part 1 — How the current system is wired

### 1. Where instructor availability lives in the database

There are **four** sources of truth, all in the public schema:

| Table | Purpose | Key columns |
|---|---|---|
| `instructor_working_hours` | Recurring weekly hours (legacy / primary) | `instructor_id`, `day_of_week` (**0=Sun..6=Sat**), `start_time`, `end_time`, `is_active` |
| `availability_windows` | Newer recurring weekly hours (multiple windows per day) | `instructor_id`, `day_of_week` (**1=Mon..7=Sun**), `start_time`, `end_time`, `is_active`, `label` |
| `instructor_date_overrides` | One-off day overrides (holidays / extra availability) | `instructor_id`, `override_date`, `override_end_date`, `is_available`, optional `start_time`/`end_time` |
| `instructor_manual_blocks` | Personal blocks (admin/dentist/etc.) | `instructor_id`, `start_datetime`, `end_datetime` (timestamptz) |

Plus two conflict sources that *consume* the windows above:

- `scheduled_lessons` — booked lessons (`lesson_date`, `start_time`, `duration_minutes`).
- `instructor_calendar_events` — cached Google Calendar busy events (`start_time`, `end_time` timestamptz, `is_busy`, `external_event_id`).

Sample (Ken, Mondays):
- `instructor_working_hours`: `day_of_week=1, start_time=10:30, end_time=16:00, is_active=true`
- `instructor_calendar_events`: `start_time=2026-06-08T10:00+01, end_time=2026-06-08T11:00+01, is_busy=true`

> ⚠️ **Two day-of-week conventions live side by side** (0=Sun in `instructor_working_hours`, 1=Mon in `availability_windows`). The shared resolver handles both; the EveryDriver page only handles 1=Mon..7=Sun.

### 2. Google Calendar credentials & auth

- Two tables exist:
  - `instructor_calendar_tokens` — OAuth flow (`access_token`, `refresh_token`, `token_expiry`, `provider='google'`). RLS = service role only.
  - `instructor_google_service_calendar` — Domain-Wide-Delegation **service-account** flow (just stores the `calendar_id` to impersonate; tokens are minted per-request from a server secret).
- The live integration in use is the **service-account / DWD** path. Edge function `google-calendar-service` builds a JWT with scope `https://www.googleapis.com/auth/calendar`, exchanges it for an access token, then hits `calendar/v3/calendars/{calendarId}/events`.
- The private key + service email are pulled from edge-function env vars (not from per-instructor rows).

### 3. What runs when a learner searches for courses

The user is on `/courses?postcode=SO225AB`, which is **`src/pages/everydriver/Courses.tsx`** (the EveryDriver branded page), not the generic `src/pages/Courses.tsx` that I refactored last week.

Flow on that page:
1. `fetchData()` (line ~820) loads, in parallel:
   - `instructors` (active, non-deleted, with `available_from`, postcode, etc.)
   - `instructor_working_hours` — but **only `instructor_id, day_of_week, is_active`** (no `start_time`/`end_time`)
   - `availability_windows` — same trimmed select
   - `instructor_date_overrides` — only `is_available` (no times)
   - `courses`
   - **Does NOT load `instructor_calendar_events`, `instructor_manual_blocks`, or `scheduled_lessons` for the listing.**
2. `handleSearch()` filters instructors by postcode/radius (geocode + Haversine), then maps courses to nearby instructors.
3. The "YOUR INSTRUCTORS" tile at the top of the calendar is built by `findFirstAvailableDate()` → `isDateAvailable()` (lines 376–429). That helper says a date is "available" iff:
   - the day is in the future, AND
   - either an override row exists for that date with `is_available=true/false`, OR
   - any working-hours row exists for that `day_of_week` with `is_active=true`.

### 4. What decides whether a specific date is bookable

There are now **two** different resolvers in the codebase, and they disagree:

- **EveryDriver page (`src/pages/everydriver/Courses.tsx`)** uses the local `isDateAvailable()` above — purely "is there a row?" with no times, no calendar, no lessons, no manual blocks.
- **Generic `/courses` page** uses `src/lib/courseAvailability.ts → hasInstructorAvailabilityOn()` which:
  - Builds the day's working windows (merging both DOW conventions),
  - Subtracts conflicts from `scheduled_lessons` + `instructor_manual_blocks` + `instructor_calendar_events` (skipping events flagged `is_busy=false` and skipping all-day ≥23h or midnight-start ≥12h events),
  - Requires the largest remaining free span to be ≥ `MIN_FREE_MINUTES` (60).

Booking-time conflict prevention sits in the DB trigger `prevent_lesson_clash` on `scheduled_lessons` — see §8.

### 5. Google Calendar refresh / cache

- Google events are **cached in `instructor_calendar_events`** by the edge function `google-calendar-service` action `fetchExternalEvents`.
- Each sync **deletes all events for the instructor** then re-upserts a window of **−30 days to +365 days**, paginated 2,500 per page.
- The sync is **only triggered on demand**: when the instructor opens their Schedule page (`InstructorSchedule.tsx`), the mobile schedule view, or `CalendarSyncPreview`. There is **no cron job and no learner-side refresh**. The visible `last_sync` on the row tells you when an instructor last opened their own schedule.
- Course search reads the cache directly — it never calls Google.

### 6. What happens when Google Calendar fails

- In the edge function: error is caught, `sync_error` written to `instructor_google_service_calendar`, function returns 500.
- In course search: irrelevant — search never calls Google. It reads `instructor_calendar_events`, and if the cache is empty/stale the instructor is treated as **fully available** (no conflicts to subtract). **Failure-open behaviour.**

---

## Part 2 — Scenario walkthrough

For each scenario: *Expected* vs *what the code actually does today on the EveryDriver page* (which is what the user is seeing).

| # | Scenario | Expected | Actual on `/courses` (EveryDriver) |
|---|---|---|---|
| 1 | Mon 9–5 working, Google event 10–11, learner wants 10h intensive starting Mon | Show only if a continuous 10h window remains; here it does not, so hide. | Shows. The page only checks "is there a working-hours row for that DOW" — it ignores course duration entirely and ignores Google events. |
| 2 | All-day Google event Tuesday | Hide instructor / mark Tues unavailable. | Shows as available. EveryDriver page never reads `instructor_calendar_events`. (Even the new shared resolver deliberately ignores all-day events ≥23h or midnight-start ≥12h, treating them as informational — so it would also show.) |
| 3 | Back-to-back calendar events | Buffer enforced before/after? | **No buffer at all** in either resolver. The instructor lesson-buffer logic stored in memory (`gap-offer-buffer-rules`, `lesson-buffer-logic`) is applied only inside the instructor portal's own gap/scheduler code, not on the public Courses page. |
| 4 | Instructor changes availability rules | Reflected within seconds (no caching). | Reflected on next page load — `fetchData()` re-queries on mount. There is no client-side TTL, but there is also no realtime subscription, so an open tab will not refresh until reload. |
| 5 | Learner in France searches UK courses | Display in UK time / instructor local time. | All times are formatted with the **browser's local timezone** via `date-fns format(..., 'yyyy-MM-dd')` and `new Date().getHours()`. A French (UTC+1) browser computing `getDay()`/`getHours()` on a UK ISO timestamp will see wrong hours and can flip a date across midnight near 23:00/00:00 UK. Working-hours rows are stored as naive `time` and assumed UK. |
| 6 | Google Calendar API errors for an instructor | Fail closed (assume busy) or warn. | **Fails open.** `sync_error` is recorded but the cached row set is whatever was last written; if the instructor never connected or the very first sync failed, the events table is empty and they look totally free. |
| 7 | Recurring weekly Google event (e.g. every Wed 2–4) | Block every future Wednesday 2–4. | The sync uses `singleEvents=true`, so Google **expands recurrences into individual instances** within the −30d/+365d window. Anything beyond +365d is invisible. EveryDriver page ignores them anyway. |
| 8 | Two simultaneous bookings of the same slot | Exactly one wins. | Enforced at the DB level by trigger `prevent_lesson_clash` on `scheduled_lessons` (advisory lock per instructor+date, raises `check_violation` if any non-cancelled lesson overlaps). Edge function `create-booking` will surface that as an error. So the DB is safe; the UI may show a generic error message. |

---

## Part 3 — Gaps & most likely cause of "wrong courses appearing"

### Scenarios not handled correctly
- **#1, #2, #6, #3** — broken on the EveryDriver page; partially better on the unused generic page.
- **#5** — timezone handling is ambient browser-local everywhere; no UK pinning.
- **#7** — works for the first 365 days only.

### Most likely source of "instructors / courses appearing when they shouldn't"
**`src/pages/everydriver/Courses.tsx`, lines 376–406 + 820–824.** This is the page the user is on. The "YOUR INSTRUCTORS" tile and the calendar-day availability are built from a resolver that:
1. Selects working hours **without `start_time`/`end_time`**, so it can't subtract anything.
2. **Never queries** `instructor_calendar_events`, `instructor_manual_blocks`, or `scheduled_lessons`.
3. Treats "any active row for that DOW" as "available all day" regardless of overrides with times, course duration, or conflicts.

Conversely, this is also why **Ken's avatar is missing** in some month views: when overrides exist, the page short-circuits on `override.is_available` and ignores everything else; and where the page expects `day_of_week` to be `1=Mon..7=Sun` but Ken's rows use `0=Sun..6=Sat`, his Sundays/Saturdays are silently dropped.

The shared resolver in `src/lib/courseAvailability.ts` is correct in principle but is wired to the wrong page.

### Incorrect assumptions baked into the code
- All instructors store DOW the same way (false: two conventions in two tables).
- Working-hours rows imply full-day availability (false: they have explicit times).
- Calendar cache is fresh (false: only refreshed when an instructor opens their schedule).
- Google failures should fail open (current behaviour, almost certainly wrong for a booking product).
- All-day events are informational (intentional, but probably wrong for "School holidays Mon–Fri").
- Browser timezone == UK (false for any non-UK learner).
- Course `duration_hours` doesn't need to be matched against free time (false — that's the whole point for intensives).
- No buffer needed before/after Google events (inconsistent with instructor-portal buffer rules).
- Recurring events beyond 365 days don't need handling.

---

## Part 4 — No code changed

Nothing was modified. Tell me which of the above you want addressed and in what order, and I'll plan fixes in a separate pass.
