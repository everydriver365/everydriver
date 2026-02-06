

## 5 Admin Portal Enhancements

### 1. Activity / Audit Log

Track all admin actions for accountability and traceability.

**What you'll see:**
- A new "Activity Log" section in the admin portal showing a chronological feed of actions
- Each entry shows: who did it, what they did, when, and on which record
- Filterable by action type (booking created, payment recorded, instructor updated, etc.)
- Searchable by name or keyword

**Technical details:**

- **Database migration:** Create `admin_activity_log` table with columns: `id`, `action_type` (text), `description` (text), `entity_type` (text, e.g. "pupil", "instructor", "booking"), `entity_id` (uuid, nullable), `metadata` (jsonb, nullable), `created_at` (timestamptz). No RLS needed since only admin accesses this.
- **New component:** `src/components/admin/ActivityLogViewer.tsx` -- fetches from `admin_activity_log`, displays in a scrollable timeline with filters for action type and date range.
- **Helper function:** Create a reusable `logAdminAction()` utility in `src/lib/adminLogger.ts` that inserts into the log table. Call it from existing components like `BespokeBookingModal`, `InstructorManager`, `EnquiriesManager`, etc. after successful mutations.
- **AdminPortal.tsx:** Add "activity-log" case to the switch and add it to `sectionMeta`.
- **AdminSettingsGrid.tsx:** Add "Activity Log" link under a new or existing category (System Settings).

---

### 2. Bulk SMS / Email Campaigns

Send broadcast messages to groups of instructors or pupils.

**What you'll see:**
- A "Campaigns" section with a compose form
- Choose audience: All Instructors, All Pupils, or filtered by area/postcode/status
- Choose channel: SMS (via existing Twilio integration) or Email (via existing Resend integration)
- Message editor with character count (for SMS) and subject line (for email)
- Send history showing past campaigns with delivery stats

**Technical details:**

- **Database migration:** Create `admin_campaigns` table: `id`, `channel` (text: 'sms' or 'email'), `audience_type` (text), `audience_filter` (jsonb, nullable), `subject` (text, nullable), `message` (text), `recipient_count` (integer), `status` (text: 'draft', 'sent'), `sent_at` (timestamptz, nullable), `created_at` (timestamptz).
- **New edge function:** `supabase/functions/send-campaign/index.ts` -- accepts campaign ID, fetches recipients from `instructors` or `pupils` based on audience filter, then loops through sending via Twilio (SMS) or Resend (email). Uses existing secrets `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `RESEND_API_KEY`.
- **New component:** `src/components/admin/CampaignManager.tsx` -- compose form with audience picker, channel toggle, message textarea, preview, and send button. Also shows a table of past campaigns.
- **AdminPortal.tsx:** Add "campaigns" case. **AdminSettingsGrid.tsx:** Add under Communications category.

---

### 3. Revenue Analytics Dashboard

Visual charts showing business performance over time.

**What you'll see:**
- Revenue over time (line chart, weekly/monthly toggle)
- Bookings by type (bar chart)
- Top instructors by revenue (horizontal bar)
- Payment method breakdown (pie chart)
- Monthly comparison vs previous period

**Technical details:**

- **New component:** `src/components/admin/RevenueAnalytics.tsx` -- uses `recharts` (already installed) to render charts. Fetches from `payment_history` (amount, payment_method, recorded_at, instructor_id) and `scheduled_lessons` (lesson_type, lesson_date, status). Groups and aggregates data client-side by week/month.
- **No database changes needed** -- all data exists in `payment_history` and `scheduled_lessons`.
- **AdminPortal.tsx:** Add "analytics" case. **AdminSettingsGrid.tsx:** Add under a new "Analytics" category or alongside the existing stat tiles.

---

### 4. Automated Compliance Alerts

Proactive notifications when instructor documents are about to expire.

**What you'll see:**
- An "Alerts" panel on the compliance dashboard showing upcoming expirations at 30, 14, 7, and 1 day thresholds
- One-click "Send Reminder" button per instructor that sends an SMS and/or email reminder
- A "Send All Reminders" bulk action for all expiring items
- Visual urgency indicators (amber for 30 days, red for 7 days and under)

**Technical details:**

- **New edge function:** `supabase/functions/compliance-reminders/index.ts` -- queries `instructors` for documents expiring within 30 days, sends SMS via Twilio and email via Resend to the instructor. Can be triggered manually from the UI or scheduled via pg_cron.
- **Update component:** `src/components/admin/ComplianceDashboard.tsx` -- add a "Send Reminder" button per instructor row and a "Send All Reminders" bulk button. These call the edge function with the instructor ID(s).
- **Database migration:** Create `compliance_reminder_log` table: `id`, `instructor_id` (uuid), `document_type` (text), `channel` (text), `sent_at` (timestamptz) -- to track what reminders have been sent and avoid duplicates.
- **AdminPortal.tsx:** No new section needed, enhances existing "compliance" section.

---

### 5. Pupil Journey Timeline

Visual progress tracker for each pupil from enquiry to test pass.

**What you'll see:**
- A vertical timeline on the pupil detail view showing key milestones:
  - Enquiry received
  - Assigned to instructor
  - First lesson completed
  - Theory test booked / passed
  - Practical test booked / passed
- Each milestone shows date, status (completed/pending/upcoming), and relevant details
- Auto-populated from existing data (enquiry, lessons, test dates)

**Technical details:**

- **New component:** `src/components/admin/PupilJourneyTimeline.tsx` -- receives a pupil ID, fetches data from `pupils` (created_at, theory_test_date, theory_test_passed, test_date, test_passed), `scheduled_lessons` (first and latest lesson dates), and `course_enquiries` (if linked via `enquiry_id`). Renders a vertical timeline using Tailwind styling.
- **Update component:** `src/components/admin/PupilRecordsManager.tsx` -- add the timeline component to the pupil detail panel, above or alongside the existing lesson history section.
- **No database changes needed** -- all milestone data already exists across `pupils`, `scheduled_lessons`, and `course_enquiries` tables.

---

### Files Summary

**New files (7):**
- `src/lib/adminLogger.ts`
- `src/components/admin/ActivityLogViewer.tsx`
- `src/components/admin/CampaignManager.tsx`
- `src/components/admin/RevenueAnalytics.tsx`
- `src/components/admin/PupilJourneyTimeline.tsx`
- `supabase/functions/send-campaign/index.ts`
- `supabase/functions/compliance-reminders/index.ts`

**Modified files (3):**
- `src/pages/AdminPortal.tsx` -- add 3 new section cases (activity-log, campaigns, analytics) and sectionMeta entries
- `src/components/admin/AdminSettingsGrid.tsx` -- add nav links for new sections
- `src/components/admin/ComplianceDashboard.tsx` -- add reminder buttons
- `src/components/admin/PupilRecordsManager.tsx` -- integrate journey timeline

**Database migrations (2):**
- Create `admin_activity_log` table
- Create `admin_campaigns` table
- Create `compliance_reminder_log` table

