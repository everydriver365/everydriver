

## Feature Toggles for Zenbooker-Inspired Features

### What We're Building

A new "Feature Toggles" settings tile in the instructor settings hub that lets instructors individually enable or disable each of the recently added features. When a feature is off, it won't render in the relevant views.

### Database Changes

Add boolean columns to the `instructors` table:

```sql
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS drive_time_alerts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quotes_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS intake_questions_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pricing_rules_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS broadcast_messaging_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS lesson_feedback_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reflective_logs_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pupil_self_booking_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_analytics_enabled BOOLEAN DEFAULT true;
```

### New Component

**`src/components/instructor/FeatureTogglesSettings.tsx`** — A card with a list of feature toggles, each with name, description, and Switch. Reads from / writes to `instructors` table. Grouped logically:

| Toggle | Default | Controls |
|--------|---------|----------|
| Drive-Time Alerts | Off | TravelTimeIndicator in TodayScheduleView |
| Bookable Quotes | Off | SendQuoteSheet availability |
| Intake Questions | Off | IntakeQuestionsSettings and form rendering |
| Dynamic Pricing | Off | PricingRulesSettings and price calculation |
| Broadcast Messaging | On | Broadcast button in InstructorInbox |
| Post-Lesson Feedback | On | Auto-feedback in EndLessonWizard + pupil prompt |
| Reflective Logs | On | ReflectiveLog in pupil portals |
| Pupil Self-Booking | Off | "Book a Lesson" tab in pupil portal |
| Cancellation Analytics | On | Tab on Performance page |

### Integration Points (Conditional Rendering)

Each feature component checks the instructor's toggle before rendering:

1. **TodayScheduleView** — Only show `TravelTimeIndicator` if `drive_time_alerts_enabled`
2. **InstructorInbox** — Only show Broadcast button if `broadcast_messaging_enabled`
3. **EndLessonWizard** — Only auto-insert feedback request if `lesson_feedback_enabled`
4. **InstructorPerformance** — Only show Cancellations tab if `cancellation_analytics_enabled`
5. **BrandedPupilPortal / PupilPortal** — Conditionally show self-booking, reflective log, and feedback prompt based on toggles
6. **InstructorSettings** — Only show Intake Questions tile if `intake_questions_enabled`; only show Pricing Rules tile if `pricing_rules_enabled`

### Settings Page Integration

Add a new `SettingsTile` in the existing settings hub under a logical category (e.g. "General" or a new "Features" section) with a `ToggleList` icon, containing the FeatureTogglesSettings component.

### Context Update

Add the new columns to the `InstructorAuthContext` instructor select query and type, so all components can read `instructor.drive_time_alerts_enabled` etc. without extra fetches.

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/instructor/FeatureTogglesSettings.tsx` |
| Modify | `src/context/InstructorAuthContext.tsx` — add new fields to type + query |
| Modify | `src/pages/InstructorSettings.tsx` — add Feature Toggles tile |
| Modify | `src/components/instructor/TodayScheduleView.tsx` — gate travel time |
| Modify | `src/components/instructor/InstructorInbox.tsx` — gate broadcast |
| Modify | `src/components/instructor/EndLessonWizard.tsx` — gate feedback |
| Modify | `src/pages/InstructorPerformance.tsx` — gate cancellation tab |
| Modify | `src/pages/BrandedPupilPortal.tsx` — gate self-booking, reflective log, feedback |
| Modify | `src/pages/PupilPortal.tsx` — gate reflective log, feedback |
| Migration | Add 9 boolean columns to `instructors` |

