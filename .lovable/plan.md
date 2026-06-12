
# EveryDriver Rebrand + Job Alerts for Enquiries

Three workstreams. Joseph Lewis data merge is parked.

---

## 1. Email domain — unblock all transactional mail

Both workspace domains (`drive365.co.uk`, `drivinglessonswinchester.com`) are `provisioning_failed`, so **no admin/instructor/pupil email leaves the platform**.

- Provision `notify.everydriver.co.uk` as the verified sender subdomain via the email setup dialog (DNS NS records added at the registrar).
- Once verified, set platform-wide constants:
  - `FROM_EMAIL = "EveryDriver <notify@notify.everydriver.co.uk>"`
  - `ADMIN_ENQUIRY_EMAIL = "enquiries@everydriver.co.uk"`

*Blocker:* user must add DNS when prompted. Nothing downstream delivers until verification succeeds.

---

## 2. Kill Drive365 branding from notification functions

Sweep these and replace every `drive365.co.uk` / `notifications.drive365.co.uk` sender, reply-to default, and Drive365 logo URL:

- `notify-admin-enquiry`
- `notify-booking-enquiry`
- `notify-test-swap-match`
- `notify-public-test-swap-request`
- `notify-lessons-scheduled`
- `send-lesson-reminders`
- `send-transactional-email`
- any other `*notify*` / `send-*` function caught in a final grep pass

Swap sender to the EveryDriver address, swap logo to `/everydriver-logo-full.svg`. Template structure unchanged.

*Out of scope here:* marketing/landing pages still referencing Drive365 — separate sweep.

---

## 3. Job Alerts for new enquiries

Real-time alert on every new enquiry (mini-website form, public booking page, course enquiry, contact form) visible in **instructor mobile app**, **admin desktop**, and **admin mobile login**, plus a dedicated **"Job Alert"** notification type.

### 3a. Data model & trigger
- Add `public.fan_out_enquiry_alert()` SECURITY DEFINER function.
- AFTER INSERT trigger on `booking_enquiries` and `course_enquiries`:
  - Insert `instructor_notifications` row, `type = 'job_offer'`, title `"New Job Alert"`, message includes hours / transmission / postcode / date, `action_url` deep-linking to the enquiry.
  - Insert `admin_alerts` row, `type = 'enquiry'`, regardless of whether an instructor was matched (so unrouted enquiries are still visible).
- Trigger fires from any source — no edge-function dependency.

### 3b. Edge-function reliability
- `notify-booking-enquiry` and `notify-admin-enquiry`: write `admin_alerts` row up-front so the alert exists even when email fails. On email failure, log `severity = warning` to `admin_alerts` instead of swallowing the error.
- Push payload uses existing `PushDataType.JOB_OFFER`. Title `"New Job Alert"`, body postcode + hours + date.

### 3c. Instructor mobile app
- `useNewEnquiriesCount` already counts `booking_enquiries` + `course_enquiries` for the instructor. Wire it into `useCombinedNotificationCount` so the bell badge increments.
- Notifications sheet gets a "Job Alerts" section at the top, listing unread `job_offer` rows, tap → `/instructor/inbox?tab=enquiries`.
- Native push with sound (reuses `useChatNotifications.playSound()`).
- No mobile *layout* changes — only badge counts and the new section row, per the explicit request for an alert in the mobile app.

### 3d. Admin desktop + admin mobile login
- New realtime subscription on `admin_alerts` filtered to `type = 'enquiry'`.
- Bell in `AdminHeader` (shared between desktop and mobile admin) with unread count, popover listing recent enquiries (source · instructor · postcode · "Open").
- Toast on receipt while admin is logged in.
- New admin dashboard widget: **"Unrouted / failed enquiries (24h)"** — counts `admin_alerts` rows where `metadata.email_sent = false`, so the next failure is visible immediately.

---

## Technical details

- Trigger: SECURITY DEFINER, `search_path = public`, idempotent on `(source_table, source_id)`.
- `admin_alerts` and `instructor_notifications` added to `supabase_realtime` publication if not already present.
- Confirm `service_role` INSERT grants on both tables.
- Push uses existing `PushDataType.JOB_OFFER` — no new client enums.

---

## Order of execution

```text
1. User adds DNS for notify.everydriver.co.uk  ← BLOCKING
2. Verify domain, set FROM_EMAIL / ADMIN_ENQUIRY_EMAIL constants
3. Rebrand 7 edge functions, redeploy
4. Migration: fan_out_enquiry_alert + triggers + realtime publication
5. Frontend: instructor bell badge + Job Alerts section,
   admin bell + unrouted-enquiries widget
6. End-to-end test: submit a test enquiry to a real instructor, confirm
   (a) admin_alerts row, (b) instructor_notifications row,
   (c) push received, (d) admin bell increments, (e) email delivered
```

Joseph Lewis merge can be picked up later as a one-off data fix.
