---
name: ICS subscription calendar sync
description: DSM uses ICS subscriptions (Total Drive model) — outbound feed + inbound poll every 5 min, no OAuth
type: feature
---

# Calendar sync — ICS subscription model

DSM no longer uses Google OAuth / service-account sync. Replaced with simple ICS subscriptions in both directions.

## Outbound (DSM → calendar app)
- Each instructor has `instructors.calendar_feed_token` (32-byte hex, indexed, rotatable).
- Edge function `instructor-calendar-feed` (verify_jwt = false) serves RFC 5545 ICS at:
  `/functions/v1/instructor-calendar-feed?token=<token>`
- Includes lessons (next 12 months) + manual blocks, floating local times (UK only).
- Instructor pastes URL once into Google/Apple/Outlook. Apps poll on their own schedule.

## Inbound (calendar app → DSM)
- Table `instructor_ics_subscriptions` — multiple feeds per instructor.
- Edge function `poll-ics-subscriptions` runs every 5 min via `pg_cron` job `poll-ics-subscriptions-5min`. Also callable on-demand with `{ subscriptionId }` or `{ instructorId }`.
- Polled events are written into `instructor_calendar_events` with `external_event_id = "ics:{sub_id}:{uid}[:recurrence_id]"`, so the existing availability engine + ~20 readers consume them unchanged.
- Stale rows (not seen in latest poll) are deleted per subscription.
- Cancelled / TRANSPARENT events skipped.

## What was removed/disabled
- `useGoogleCalendarRefresh` and `refreshGoogleCalendar` are now no-op stubs (kept for compile compatibility).
- `GoogleServiceAccountSetup` replaced everywhere by `IcsCalendarSync` UI component.
- Old Google sync edge functions (`google-calendar-service`, `google-calendar-sync`, `google-calendar-webhook`, `reconcile-google-calendar`, `renew-google-calendar-webhooks`, `sync-lesson-now`) still exist but are no longer the path of any user-facing flow. Pending deletion in a follow-up pass.

## Tables
- `instructor_ics_subscriptions`: id, instructor_id, url, label, is_active, last_polled_at, last_status, last_error, last_event_count. RLS scoped via `get_instructor_id_for_user(auth.uid())`.
- `instructor_ics_events`: created but unused — the poller writes into `instructor_calendar_events` instead to avoid changing readers.
- `instructor_calendar_events`: continues to be the canonical "busy" source — but rows now come from ICS polling, not Google API.
