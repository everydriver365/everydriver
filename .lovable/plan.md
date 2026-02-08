

## Add Reminders, Referrals, Plan & Upgrade Widgets to Instructor Portal

### Overview

Add four new widget cards to the existing instructor home page (both desktop right sidebar and mobile home screen) -- no separate dashboard page needed. These cover the missing pieces: reminder status, referral stats, current plan display with upgrade option, and payment/upgrade options.

---

### What Gets Added

| Widget | What It Shows |
|--------|--------------|
| **Subscription Plan Card** | Current plan name, badge, and feature highlights. "Upgrade" button linking to a plan comparison sheet. If on Free, shows prominent upgrade CTA. |
| **Upgrade Plan Sheet** | A slide-up sheet/dialog listing all available plans (Free, Pro, Max, Multi, Enterprise) with prices, features, and a "Contact to Upgrade" or "Select Plan" action per plan. |
| **Reminder Status Widget** | Lessons in the next 24 hours with their reminder status (24h sent, 1h sent, pending). Shows enabled channels from `instructor_reminder_preferences`. |
| **Referral Stats Widget** | Compact version of the referral stats (total/completed/pending counts) with a link to full referral settings. |

---

### Desktop Layout Changes (InstructorPortal.tsx)

The right sidebar column (currently only has PaymentSummaryWidget) will gain 3 new cards stacked below it:

```text
Right Sidebar (lg:col-span-1):
  [Payment Summary]        <-- existing
  [Your Plan]              <-- NEW
  [Reminder Status]        <-- NEW
  [Referral Stats]         <-- NEW
```

---

### Mobile Layout Changes (InstructorMobileHome.tsx)

Add the widgets to the INSIGHTS section of the mobile home, below the existing stats card:

```text
INSIGHTS section:
  [Today's Stats]          <-- existing
  [Your Plan]              <-- NEW
  [Reminder Status]        <-- NEW
  [Referral Stats]         <-- NEW
```

---

### New Files

| File | Purpose |
|------|---------|
| `src/components/instructor/dashboard/PlanWidget.tsx` | Shows current plan with badge, key features, and "Upgrade" button. Fetches plan data from the `subscription` in `useInstructorAuth`. Opens the upgrade sheet when clicked. |
| `src/components/instructor/dashboard/UpgradePlanSheet.tsx` | A dialog/sheet listing all plans from `subscription_plans` with prices and features. Shows the current plan as "Current" and others with upgrade CTAs. Contact-based upgrade flow (no self-service payment change yet). |
| `src/components/instructor/dashboard/ReminderStatusWidget.tsx` | Queries `scheduled_lessons` for lessons in the next 24h, checks `reminder_24h_sent_at` and `reminder_1h_sent_at` columns, and queries `instructor_reminder_preferences` for channel config. Displays a compact list with status badges. |
| `src/components/instructor/dashboard/ReferralStatsWidget.tsx` | Compact card querying `pupil_referrals` for counts by status. Shows total/completed/pending with a "Manage" link to `/instructor/settings` (referral section). |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/InstructorPortal.tsx` | Import and render PlanWidget, ReminderStatusWidget, and ReferralStatsWidget in the right sidebar column. |
| `src/components/instructor/InstructorMobileHome.tsx` | Import and render the same three widgets in the INSIGHTS section. |

---

### Technical Details

**PlanWidget data source:**
- Uses `useInstructorAuth()` to get `subscription.plan_name`, `subscription.plan_slug`, `subscription.features`
- No additional database query needed

**UpgradePlanSheet data source:**
- Fetches all active plans from `subscription_plans` table ordered by `display_order`
- Compares against current `subscription.plan_slug` to highlight the active plan
- Upgrade action shows a toast with "Contact us to upgrade" (or can be wired to a contact form/email later)

**ReminderStatusWidget queries:**
- `scheduled_lessons` where `lesson_date` is today or tomorrow, `status != 'cancelled'`, checking `reminder_24h_sent_at` and `reminder_1h_sent_at`
- `instructor_reminder_preferences` for enabled channels (SMS, email, push)
- Displays: lesson time, pupil name, green check or amber clock icon per reminder type

**ReferralStatsWidget queries:**
- `pupil_referrals` where `instructor_id` matches, grouped by status
- Simple 3-number display (total, completed, pending) matching the existing ReferralSettingsCard style

**No database migrations needed** -- all data already exists in the schema.

---

### Implementation Steps

| Step | Action |
|------|--------|
| 1 | Create `PlanWidget.tsx` and `UpgradePlanSheet.tsx` |
| 2 | Create `ReminderStatusWidget.tsx` |
| 3 | Create `ReferralStatsWidget.tsx` |
| 4 | Add all three widgets to the desktop portal right sidebar in `InstructorPortal.tsx` |
| 5 | Add all three widgets to the mobile home INSIGHTS section in `InstructorMobileHome.tsx` |

