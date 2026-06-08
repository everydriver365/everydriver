# Plan: Replace Google OAuth sync with two-way ICS subscriptions

Match the Total Drive model exactly. No OAuth, no service account, no webhooks, no token refresh. Just two ICS URLs per instructor: one DSM publishes (lessons out), one or more DSM subscribes to (busy events in).

## How it will work

**Outbound — DSM → calendar app:**
- Each instructor gets a private `.ics` feed URL from DSM containing all confirmed lessons + manual blocks for the next 12 months.
- Instructor pastes it once into Google / Apple / Outlook ("Add calendar from URL").
- The calendar app polls it on its own schedule.

**Inbound — Google/Apple/Outlook → DSM:**
- Instructor copies the "Secret address in iCal format" from each Google calendar they want DSM to respect (personal, family, work — multiple supported).
- Pastes each URL into DSM ("Block bookings from this calendar").
- DSM polls every 5 minutes (per user choice) and stores each event as a busy block.
- Availability engine treats every event in those feeds as "instructor busy" — booking is impossible during them.

No DSM ↔ Google API call ever happens. Everything is a plain HTTPS GET of a text file.

## Hard cut-over (per user choice)

- Old Google OAuth + service-account flow is removed entirely.
- `instructor_calendar_events` is wiped and the table is dropped (or kept empty and unused).
- Every instructor must add their ICS feeds once. Until they do, only DSM lessons + manual blocks count as busy — exactly what they would expect.
- Admin "Google sync" dashboards, "reconnect Google", weekly resync, unmatched events, sync alerts — all removed.

## Phases

**Phase 1 — Outbound feed**
- New edge function `instructor-calendar-feed` serves valid RFC 5545 `.ics`.
- New column `instructors.calendar_feed_token` (random, unique, indexed). One-click "Rotate URL" button.
- Settings page "Calendar sync" shows the feed URL + copy button + step-by-step instructions for Google, Apple, Outlook.

**Phase 2 — Inbound subscriptions**
- New table `instructor_ics_subscriptions` (id, instructor_id, url, label, last_polled_at, last_status, last_event_count, is_active). Multiple rows per instructor.
- New table `instructor_ics_events` (id, subscription_id, instructor_id, uid, start_at, end_at, title, last_seen_at). Replaces `instructor_calendar_events` as the inbound "busy" source.
- New edge function `poll-ics-subscriptions`: every 5 min via `pg_cron`, fetches each active feed, parses ICS, upserts events for the next 12 months, deletes events not seen in the latest fetch. Idempotent on `(subscription_id, uid, recurrence_id)`.
- Settings UI: add/remove/relabel feeds, show last poll time + status + event count, "Refresh now" button.

**Phase 3 — Availability engine swap**
- `buildDayConflicts` reads `instructor_ics_events` + `instructor_manual_blocks` (currently reads `instructor_calendar_events` + manual blocks — drop-in replacement).
- All availability rules (buffers, working hours, holiday blocks, lead time, horizon, London timezone clipping) unchanged.
- `useGoogleCalendarRefresh` hook removed everywhere it's mounted (LessonScheduler, add/reschedule sheets, find-a-slot, pupil self-booking). Booking surfaces no longer trigger any sync.

**Phase 4 — Remove old machinery**
- Delete edge functions: `google-calendar-service`, `google-calendar-sync`, `google-calendar-webhook`, `sync-lesson-now`, plus any reconcile/resync/unmatched-events jobs.
- Drop pg_cron entries for the old sync.
- Remove components: `useGoogleServiceCalendar`, `useGoogleCalendarRefresh`, `refreshGoogleCalendar`, Google connect/disconnect UI, admin Google sync dashboards, `unmatched_google_events`, `google_sync_alerts`, `calendar_sync_queue`, `instructor_google_service_calendar`, `instructor_calendar_tokens`, `instructor_calendar_events` (after migration completes).
- Soft-delete pipeline keeps working — it just stops calling Google. Removing a lesson in DSM disappears from the instructor's calendar app on the app's next ICS poll (Google: a few hours; Apple: ~15 min; can refresh manually).

## Technical notes

- ICS output: VTIMEZONE Europe/London, stable `UID` per lesson + per manual block, `LAST-MODIFIED` for change detection, `STATUS:CONFIRMED`, location set to pickup postcode.
- ICS poll: 5-minute `pg_cron` job, batched, with per-feed timeout + retry, status surfaced in settings UI. Treats any all-day event as full-day busy. Honours `EXDATE` and recurrence (`RRULE`) for the 12-month window.
- Token security: 32-byte random URL-safe token; rotating it instantly invalidates the old URL.
- No mobile layout changes — only adds a "Calendar sync" settings panel and a busy-feed manager in the existing settings sections.
- Existing DB clash trigger on `scheduled_lessons` stays as last-resort guard.
- Update memory: `mem://constraints/google-calendar-source-of-truth` and `mem://features/instructor/automated-google-calendar-sync` will be rewritten to reflect ICS-only model.

## What the user gets

- No weekly repair loop.
- Personal events still block bookings (the thing you wanted).
- Multiple personal calendars supported per instructor.
- Reaction time to a new personal event: up to 5 min.
- DSM keeps working perfectly even if Google is down.
- ~6 fewer edge functions and ~5 fewer tables to maintain.

## Trade-offs (worth being explicit)

- Outbound lesson updates appear in Google on Google's own poll schedule (typically 1–3 hours). Apple/Outlook are faster. Acceptable for personal-calendar viewing; not for real-time coordination — but DSM is the source of truth for that anyway.
- Cancellations in DSM disappear from the instructor's calendar app the same way (next poll). The DSM app itself shows them instantly.
- One-time setup cost per instructor: paste two URLs. Documented with screenshots.
