## Goal

When a pupil contacts an "enquiry-only" instructor (or submits any mini-site contact form), the lead must:

1. Land in the instructor's **Jobs** list (today it's only there for `course_enquiries` / admin bespoke leads).
2. Trigger an **in-app notification** + **push** to that instructor.
3. Trigger an **admin alert** + email fan-out to all `site_settings.admin_notification_emails`.

## What already works (don't rebuild)

- DB trigger `trg_fan_out_booking_enquiry_alert` already writes one `instructor_notifications` row (`type='job_offer'`) **and** one `admin_alerts` row (`alert_type='enquiry'`) on every `booking_enquiries` insert. Same for `course_enquiries`.
- `EnquiryFlow.tsx` already invokes `notify-booking-enquiry` (WhatsApp/SMS/email + push) and `notify-admin-enquiry` (one admin email).
- "Enquiry-only" branching in `BookingSummary.tsx` already routes to `<EnquiryFlow />`.

## Gaps to close

| # | Gap | Fix |
|---|-----|-----|
| 1 | **Jobs list ignores `booking_enquiries`** — `usePendingJobsList/Count/Preview` only query `course_enquiries`. Mini-site enquiries never appear in the Jobs tile or `/instructor/jobs`. | Union both tables in a single Postgres view `instructor_pending_jobs_v` and point the three hooks at it. Realtime: subscribe to both tables. |
| 2 | **No unified "mark accepted/declined"** for booking_enquiries from the Jobs UI. | Add an action handler that updates `booking_enquiries.status` (`new` → `accepted`/`declined`) matching the existing `course_enquiries` accept/decline shape. |
| 3 | **Admin email fan-out inconsistent** — `notify-admin-enquiry` uses one hardcoded `ADMIN_ENQUIRY_EMAIL` env var; `create-enquiry` reads `site_settings.admin_notification_emails`. | Update `notify-admin-enquiry` to also read `site_settings.admin_notification_emails` and fan out to every address (keep the env var as a final fallback only if the table is empty). |
| 4 | **Push to instructor on booking_enquiries** — `notify-booking-enquiry` sends WhatsApp/SMS/email but doesn't call `send-push-notification`. (Only `create-enquiry` does, for `course_enquiries`.) | Add a `send-push-notification` invoke inside `notify-booking-enquiry` with title "New enquiry from {pupil}", deep link to `/instructor/jobs?id={enquiry_id}`. |
| 5 | **Generic mini-site contact form** — confirm whether any non-`EnquiryFlow` contact form (e.g. a "Get in touch" form on the mini-site outside the booking flow) writes to a different table. If yes, route it through `submit_booking_enquiry` RPC so the same trigger + fan-out applies. | Audit + redirect to the same RPC. (One-line change per call site.) |

## Implementation outline

```text
DB (one migration)
  └─ CREATE VIEW public.instructor_pending_jobs_v AS
       SELECT id, instructor_id, 'booking_enquiry' AS source,
              pupil_name, pupil_phone, pupil_email,
              preferred_date, preferred_time, message,
              status, created_at
       FROM public.booking_enquiries
       WHERE status IN ('new','pending')
       UNION ALL
       SELECT id, assigned_instructor_id AS instructor_id, 'course_enquiry' AS source,
              pupil_name, pupil_phone, pupil_email,
              preferred_date, preferred_time, message,
              status, created_at
       FROM public.course_enquiries
       WHERE status = 'pending';
     GRANT SELECT ON public.instructor_pending_jobs_v TO authenticated;
     -- RLS via security_invoker so existing table policies apply.

Hooks
  ├─ usePendingJobsCount.ts    → query view, filter by instructor_id
  ├─ usePendingJobsList.ts     → query view + subscribe to BOTH tables
  └─ usePendingJobsPreview.ts  → same, take first row

UI
  ├─ InstructorJobs.tsx        → render `source` chip ("Mini-site" vs "Bespoke")
  └─ Action buttons branch on `source` when accepting/declining

Edge functions
  ├─ notify-booking-enquiry    → add send-push-notification invoke
  └─ notify-admin-enquiry      → fan out to site_settings.admin_notification_emails
```

## Verification

- Submit a test enquiry via `EnquiryFlow` on a known enquiry-only instructor.
- Confirm: row in `booking_enquiries`, row in `instructor_notifications` (type `job_offer`), row in `admin_alerts` (type `enquiry`), email landed for every address in `admin_notification_emails`, push received by instructor app, job appears in `/instructor/jobs` with "Mini-site" chip and acts correctly when accepted.

## Out of scope

- No changes to `course_enquiries` admin bespoke flow (already works).
- No changes to instructor working-hours / availability logic.
- No mobile layout edits (per project rule).
- No new tables — reuse `booking_enquiries`.
- Won't touch `enquiry_notes` (scaffolded but unused — leave for a future feature).
