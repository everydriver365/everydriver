
# Feature Enhancement Plan

This plan covers 6 features to improve the instructor experience: recurring lessons polish, floating action button, reminder improvements, quick message templates, weekly summary widget, and vehicle cost tracking for tax.

---

## 1. Floating Action Button (FAB) for Quick-Add

Add a mobile-friendly floating action button to the Schedule page that stays fixed at the bottom-right corner for one-tap lesson creation.

**Changes:**
- Create new component `src/components/instructor/ScheduleFAB.tsx`
- Update `src/pages/InstructorSchedule.tsx` to include the FAB
- The FAB will open the existing `AddLessonSheet` component

---

## 2. Enhanced Automated Reminders

The system already has a cron job running at 6pm daily sending tomorrow's lesson reminders. Enhancements include:

- Add instructor notification setting to enable/disable reminders
- Add push notification support alongside SMS/email
- Create settings UI in instructor preferences

**Changes:**
- Create `src/components/instructor/ReminderSettings.tsx` component
- Update `supabase/functions/send-lesson-reminders/index.ts` to check instructor preferences and send push notifications
- Add database migration for `instructor_reminder_preferences` table

---

## 3. One-Tap Quick Message Templates

Add quick-tap message templates for common messages (running late, on my way, etc.) accessible from lesson cards.

**Changes:**
- Create `src/components/instructor/QuickMessageSheet.tsx` with preset messages
- Update `ExpandableLessonCard.tsx` to include quick message trigger
- Templates include: "On my way", "Running 5 mins late", "Running 10 mins late", "Please be ready", "Lesson cancelled"

---

## 4. Weekly Summary Widget

Add a compact summary widget at the top of the Schedule page showing:
- Hours taught this week
- Earnings this week
- Lessons completed
- Cancellation rate

**Changes:**
- Create `src/components/instructor/WeeklySummaryWidget.tsx`
- Add to `InstructorSchedule.tsx` above the schedule views
- Fetch data from `scheduled_lessons` and `payment_history` tables

---

## 5. Vehicle Cost Tracking for Tax (HMRC)

Consolidate vehicle service costs with general expenses for comprehensive tax reporting:

**Changes:**
- Create `src/components/instructor/vehicle-health/VehicleCostSummary.tsx`
- Shows total service/repair costs by tax year
- Links to existing service history with costs
- Adds HMRC-friendly export (CSV with categories: repairs, servicing, MOT, insurance)
- Update `ServiceRemindersTab.tsx` to display running cost totals

---

## 6. Recurring Lessons Enhancement

The recurring lesson feature exists but needs polish:

**Changes:**
- Add visual indicator on calendar/schedule for recurring lessons
- Add "Edit series" option to modify all future recurring lessons
- Show recurrence info in lesson details sheet

---

## Implementation Order

| Priority | Feature | Complexity |
|----------|---------|------------|
| 1 | Floating Action Button | Low |
| 2 | Weekly Summary Widget | Medium |
| 3 | Quick Message Templates | Low |
| 4 | Vehicle Cost Tracking | Medium |
| 5 | Recurring Lessons Polish | Medium |
| 6 | Enhanced Reminders | High |

---

## Technical Details

### Database Changes
```sql
-- Instructor reminder preferences
CREATE TABLE IF NOT EXISTS instructor_reminder_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE,
  sms_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '18:00:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id)
);
```

### New Files
- `src/components/instructor/ScheduleFAB.tsx`
- `src/components/instructor/QuickMessageSheet.tsx`
- `src/components/instructor/WeeklySummaryWidget.tsx`
- `src/components/instructor/ReminderSettings.tsx`
- `src/components/instructor/vehicle-health/VehicleCostSummary.tsx`

### Modified Files
- `src/pages/InstructorSchedule.tsx`
- `src/components/instructor/ExpandableLessonCard.tsx`
- `src/components/instructor/CalendarEventSheet.tsx`
- `src/components/instructor/vehicle-health/ServiceRemindersTab.tsx`
- `supabase/functions/send-lesson-reminders/index.ts`
