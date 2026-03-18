

## Plan: Add 6 Features from Checkfront, Bookeo & Arlo

Features to implement: (1) Digital Waivers, (2) Abandoned Checkout Remarketing, (4) Daily Manifest, (5) Waiting List Auto-Notify, (6) Certification & Progress Tracking, (7) End-of-Day Report Enhancement.

**Note:** Feature 5 (Waiting List) already has a solid foundation — `lesson_waitlist`, `slot_offers` tables, `PupilWaitlistSignup` component, and `process-cancellation-waitlist` edge function exist. We'll enhance it with ordered queue priority and timed claim windows. Feature 7 (End-of-Day Report) already has `EndOfDaySummary` and `eod-notification` — we'll enhance with cash/card breakdown and week-over-week comparison.

---

### Database Migration (1 migration, 4 new tables)

1. **`digital_waivers`** — `id, instructor_id, title, waiver_type (medical/terms/parental), content_html, is_required, created_at`
2. **`waiver_signatures`** — `id, waiver_id, pupil_id, instructor_id, signed_at, signature_data (text, base64), ip_address, parent_name, parent_email`
3. **`abandoned_checkouts`** — `id, instructor_id, pupil_name, pupil_email, pupil_phone, booking_data (jsonb), created_at, reminder_sent_at, converted_at, resume_token`
4. **`pupil_certifications`** — `id, pupil_id, instructor_id, milestone_type (theory_ready/practical_ready/course_complete/hours_milestone), title, awarded_at, notes`

- RLS on all tables scoped via `get_instructor_id_for_user(auth.uid())`
- Add `queue_position` and `claim_expires_at` columns to existing `slot_offers` table for ordered waiting list

### Edge Functions (2 new)

1. **`process-abandoned-checkouts`** — Finds checkouts older than 1 hour without `converted_at`, sends reminder email/SMS via existing Twilio/Resend, marks `reminder_sent_at`
2. **`generate-daily-manifest`** — Queries day's lessons with pupil details, pickup addresses, payment status; returns structured JSON for frontend rendering and PDF download

### Frontend Components (6 new)

1. **`DigitalWaiverManager.tsx`** — Create waiver templates, view signature status per pupil, send waiver reminders. Badge on pupil cards showing signed/unsigned.
2. **`AbandonedCheckoutTracker.tsx`** — List abandoned bookings with time elapsed, one-tap resend reminder, conversion tracking stats.
3. **`DailyManifest.tsx`** — Printable day sheet: pupil name, time, pickup address, phone, lesson type, payment status. Check-in toggle per lesson. Print/share as PDF button.
4. **`WaitingListManager.tsx`** — Enhanced view showing queue order, claim windows, auto-escalation to next pupil if unclaimed within time window.
5. **`CertificationTracker.tsx`** — Award milestones (Theory Ready, Practical Ready, Course Complete), visual timeline on pupil profile, issue shareable certificates.
6. **`EnhancedEODReport.tsx`** — Extends existing EOD with cash vs card breakdown, mileage, cancellation count, and comparison to same day last week.

### Page Wrappers & Routing

- 6 new page files in `src/pages/`
- 6 new lazy routes in `App.tsx`
- 6 new entries in `discoverFeaturesData.ts`

### Integration Points

- Abandoned checkout tracking hooks into existing booking flow (save to `abandoned_checkouts` on booking start, clear on payment confirmation)
- Waiver status badge added to pupil card/profile views
- Daily manifest accessible from the schedule/agenda page header
- Certification milestones visible in pupil portal progress section

### No New Secrets Required

All features use existing infrastructure (Twilio for SMS, Resend for email, `signatures` storage bucket for waiver signatures, existing PDF generation).

