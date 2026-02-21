

# Comprehensive Instructor App Enhancement Plan

This plan covers 10 major improvements across features and UX polish. Given the scope, the work is organized into logical phases.

---

## Phase 1: Lesson Package / Block Booking System

**What it does:** Let instructors sell pre-paid lesson packages (e.g., 10-hour block) and automatically track remaining hours per pupil.

**Technical steps:**
- Create a `lesson_packages` table (id, instructor_id, name, total_hours, price, description, is_active)
- Create a `pupil_packages` table (id, pupil_id, instructor_id, package_id, hours_purchased, hours_remaining, purchased_at, expires_at, status)
- Build a `LessonPackageManager` component in instructor settings for creating/editing packages
- Build a `PupilPackageCard` component showing active packages and remaining hours on the pupil profile
- Update lesson completion logic to auto-deduct hours from active packages
- Add a "Buy Package" flow accessible from the pupil profile
- Add renewal prompt when hours drop below 2

---

## Phase 2: Automated Lesson Reminders

**What it does:** Send SMS/email/push reminders to pupils the day before their lessons.

**Current state:** `ReminderSettings.tsx` and `instructor_reminder_preferences` table already exist for configuration.

**Technical steps:**
- Create a `send-lesson-reminders` edge function (or enhance the existing one) that:
  - Queries tomorrow's scheduled lessons
  - Checks instructor reminder preferences (channels, time)
  - Sends SMS via Twilio, push via web-push utility, and/or email via Resend
- Set up a cron job to trigger the edge function daily at configurable times (e.g., 6 PM the day before)
- Add a reminder status badge on lesson cards showing "Reminder sent"
- Track sent reminders in a `lesson_reminders_log` table to prevent duplicates

---

## Phase 3: Waiting List Enhancement

**Current state:** `WaitlistManager.tsx` already exists with full CRUD, real-time updates, and slot offer approval.

**Technical steps:**
- Add a "Add to Waitlist" button directly on pupil profile cards
- Add waitlist count badge on the Gaps & Waitlist tab
- Add auto-matching: when a lesson is cancelled, automatically cross-reference waitlist preferences and suggest matches (enhance `CancellationBackfillSheet`)

---

## Phase 4: Pupil Self-Service Booking

**What it does:** Allow pupils to book, reschedule, or cancel lessons from their portal.

**Technical steps:**
- Create an `instructor_booking_settings` table (instructor_id, allow_self_booking, allow_reschedule, allow_cancellation, min_notice_hours, max_advance_days, available_slot_duration)
- Add booking settings UI in instructor settings
- Create an `AvailableSlots` component for the pupil portal that shows open slots based on instructor working hours minus existing bookings and external calendar events
- Add a booking confirmation flow with optional instructor approval
- Add reschedule and cancel buttons on upcoming lesson cards in the pupil portal
- Send push/SMS notifications to the instructor when a pupil books, reschedules, or cancels
- Respect the instructor's cancellation policy (min notice hours)

---

## Phase 5: Annual Business Reports

**Current state:** `TaxYearReport.tsx` exists for tax-year PDF generation with mileage allowance calculations.

**Technical steps:**
- Create an `AnnualBusinessReport` component that consolidates:
  - Total income (from payment_history)
  - Total expenses (from instructor_expenses)
  - Net profit
  - Total mileage and HMRC mileage allowance
  - Pass rate statistics (from test results)
  - Pupil retention metrics (active vs. churned)
  - Lesson volume by month (chart)
- Generate a downloadable PDF report using jsPDF
- Add a "Business Reports" section in the Money/Accounts area
- Support filtering by tax year (Apr-Apr) or calendar year

---

## Phase 6: Onboarding Walkthrough

**Current state:** `InstructorSetupChecklist` exists as a task-based checklist.

**Technical steps:**
- Create a `WelcomeTour` component using a step-by-step tooltip overlay (built with Radix Popover positioning)
- Define tour steps highlighting: Dashboard tiles, Schedule, Pupils, Settings, Quick Actions
- Store tour completion status in the `instructors` table (`has_completed_tour` boolean column)
- Trigger automatically on first login; allow re-triggering from settings
- Add a brief animated intro modal welcoming the instructor with 3-4 key feature highlights

---

## Phase 7: Skeleton Loading States Everywhere

**Current state:** Some pages use `Skeleton`, many still use spinners or "Loading..." text.

**Technical steps:**
- Create reusable skeleton templates:
  - `ScheduleSkeleton` for the schedule/diary views
  - `PupilListSkeleton` for the pupils page
  - `FinanceSkeleton` for earnings/payment pages
  - `SettingsSkeleton` for settings panels
  - `MessagesSkeleton` for chat/messaging views
- Replace all `<Loader2 className="animate-spin" />` and "Loading..." text patterns with contextual skeleton screens
- Use the existing `useSkeletonMorph` hook for smooth skeleton-to-content transitions
- Target the highest-traffic pages first: Home, Schedule, Pupils, Messages

---

## Phase 8: Branded Empty States

**Current state:** Most empty states are plain text ("No data yet"). `QuietDayEmpty` exists as a good example.

**Technical steps:**
- Create an `EmptyState` reusable component with props: icon, title, description, action button, illustration
- Apply themed empty states to all major sections:
  - Schedule: "No lessons today" with book/fill-gaps CTA
  - Pupils: "Add your first pupil" with add button
  - Messages: "No conversations yet" with messaging illustration
  - Expenses: "Track your first expense" 
  - Test Results: "Record your first test result"
  - Mileage: "Complete a GPS session to start tracking"
- Use consistent styling matching the app's design language (icon + heading + subtext + CTA)

---

## Phase 9 (Skipped per your request)

---

## Phase 10: Pull-to-Refresh on Key Pages

**Current state:** `PullToRefresh` component exists with a driving animation but is not widely used.

**Technical steps:**
- Wrap the following mobile views with `PullToRefresh`:
  - Home dashboard (refetch all tiles)
  - Schedule list view (refetch lessons)
  - Pupils list (refetch pupils)
  - Messages inbox (refetch conversations)
  - Waitlist view (refetch waitlist entries)
- Wire each `onRefresh` to invalidate the relevant React Query caches
- Ensure pull-to-refresh only activates when scrolled to top (already handled by the component)

---

## Database Changes Summary

New tables needed:
1. `lesson_packages` - package definitions
2. `pupil_packages` - pupil package purchases and tracking
3. `lesson_reminders_log` - track sent reminders
4. `instructor_booking_settings` - self-service booking configuration

Column additions:
- `instructors.has_completed_tour` (boolean, default false)

New edge functions:
- Enhanced `send-lesson-reminders` with cron scheduling

New cron job:
- Daily lesson reminder trigger

All new tables will have appropriate RLS policies restricting access to the owning instructor.

---

## Implementation Order

The work will be done in this sequence to manage dependencies:

1. Skeleton loading states and empty states (instant UX lift, no backend changes)
2. Pull-to-refresh integration on key pages
3. Onboarding walkthrough
4. Automated lesson reminders (DB + edge function + cron)
5. Lesson package/block booking system (DB + UI)
6. Waiting list enhancement
7. Pupil self-service booking (most complex - depends on working hours data)
8. Annual business reports (aggregation logic)

