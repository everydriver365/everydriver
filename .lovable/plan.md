# Import Google Calendar Events as DSM Lessons

Turn events you create directly in Google Calendar into real DSM lessons (not just "busy" blocks), with pupil matching by name. When the name doesn't match a pupil, the event is **skipped and you get a notification** to resolve it manually.

## How it will work

1. When Google pushes an event update (or hourly reconcile runs), we already mirror it into `instructor_calendar_events`. We add a new step right after the mirror:
   - For each external event that is **not** already linked to a lesson or manual block, attempt to convert it to a lesson.
2. Pupil matching: case-insensitive match of the event **title** (and optionally the attendee name) against `pupils.name` for that instructor. Match rules:
   - Exact match → use that pupil.
   - Single fuzzy match (title contains pupil name or vice versa) → use that pupil.
   - Zero matches or multiple matches → **skip** and create an instructor notification.
3. Lesson creation:
   - `instructor_id` = the connected instructor
   - `pupil_id` = matched pupil
   - `lesson_date`, `start_time`, `duration_minutes` = from the Google event (Europe/London)
   - `pickup_location` = event location (geocoded via postcodes.io if it's a UK postcode, per existing lesson coordinates rule)
   - `price` = pupil default hourly rate × duration (per existing pricing helpers)
   - `status` = `scheduled`
   - `google_event_id` = the external event id (so future edits/deletes in Google reconcile correctly via the existing webhook + reconcile path)
   - `source` = `google_calendar_import` (new value) so the UI can badge it
4. Idempotency: before inserting, check `scheduled_lessons.google_event_id`. If a lesson already exists for that event id, only update mutable fields (time, duration, location) — never duplicate.
5. Updates from Google: if the event time/location changes in Google, the matching lesson is updated in place. Deletes already cascade via the existing reconcile pipeline (cancels the lesson).
6. Skipped events → notification:
   - Insert into `instructor_notifications` with a "Google event needs a pupil" message, the event title, time, and a deep link to a small **Unmatched Imports** screen where you can either pick a pupil (creates the lesson) or dismiss (keeps it as a busy block only).
   - We remember dismissed event ids so we don't re-notify on every sync.

## What you'll see in DSM

- New lessons appear in Today's schedule, weekly view, pupil history, earnings — everywhere a normal lesson appears.
- A small **"From Google"** badge on the lesson card so you know it originated outside DSM.
- A bell notification when an event was skipped because the pupil couldn't be identified.
- An **Unmatched Google Events** list under Schedule → Calendar settings.

## Technical changes

**Database (migration)**
- Add `source TEXT` to `scheduled_lessons` (default `dsm`, allowed: `dsm`, `google_calendar_import`, `ai_booking`, etc.) — used for the badge and analytics.
- Add `unmatched_google_events` table: `id`, `instructor_id`, `external_event_id` (unique per instructor), `title`, `start`, `end`, `location`, `status` (`pending` | `dismissed` | `resolved`), timestamps. RLS scoped via `public.get_instructor_id_for_user(auth.uid())`. Grants for `authenticated` + `service_role`.
- Index `scheduled_lessons (instructor_id, google_event_id)` if not already present.

**Edge functions**
- `google-calendar-service` → `fetchExternalEvents`: after upserting `instructor_calendar_events`, call a new helper `importExternalEventsAsLessons(instructorId)`.
- New helper (same function file) does the matching, lesson upsert, and unmatched-event row creation. Pupil match uses `pupils` filtered by instructor and `archived_at is null`.
- Reuse existing geocoding (postcodes.io) for `pickup_lat/lng`.
- Reuse `resolveHourlyRate` for pricing.
- `google-calendar-webhook` and `reconcile-google-calendar` both already call `fetchExternalEvents`, so they automatically pick up the new import step.

**Client**
- New page `src/pages/instructor-app/UnmatchedGoogleEvents.tsx` listing pending rows with "Assign pupil" (dropdown of pupils, then creates lesson via existing booking RPC) and "Dismiss" actions.
- Lesson card: render a small **"From Google"** chip when `source === 'google_calendar_import'`.
- Notification handler: new notification type `google_event_unmatched` deep-links to the new page.
- Settings → Google Calendar section: a "Unmatched events (N)" link.

**Out of scope (won't change)**
- Existing DSM → Google push (still one-way out for DSM-created lessons).
- Mobile layouts (per project rule, only touch if you ask).

## Open follow-up (non-blocking)

After this ships, if name matching turns out to skip a lot of your events, we can layer in title-prefix conventions (e.g. `"Lesson — Jane Doe"`) or attendee-email matching. Defaulting to strict matching first keeps wrong-pupil bookings from sneaking in.
