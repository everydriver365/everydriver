

# Lesson End-Time Alert

## What It Does

When a lesson reaches its scheduled end time, a dismissible alert overlay appears prompting the instructor to complete the end-of-lesson wizard. The alert shows the pupil name, lesson time, and a "Complete Lesson" button that opens the `EndLessonWizard`.

## Approach

### New Hook: `useLessonEndAlert`

A hook that runs in `InstructorPortalLayout`, polling the instructor's today lessons from `scheduled_lessons`. It calculates each lesson's end time (`start_time + duration_minutes`) and compares against `Date.now()`. When a lesson's end time has passed and its status is still `scheduled`/`in_progress`/`arrived`, it surfaces it as "needs completion."

- Checks every 30 seconds
- Only shows lessons that are not yet `completed` or `cancelled`
- Stores dismissed lesson IDs in local state so the alert doesn't reappear after dismissal

### New Component: `LessonEndAlert.tsx`

A modal overlay (similar to `UrgentAlertOverlay`) with:
- Amber/orange header (not red — this is a reminder, not an emergency)
- Pupil name and lesson time
- "Complete Lesson" button → opens the `EndLessonWizard`
- "Dismiss" button → hides until next uncompleted lesson

### Integration

- Mount `LessonEndAlert` in `InstructorPortalLayout` alongside the existing `UrgentAlertOverlay`
- On "Complete Lesson" tap, pass the lesson data to `EndLessonWizard` (already used in `TodayScheduleView` and `NextUpTile`)

## Files

1. **Create** `src/hooks/useLessonEndAlert.ts` — poll today's lessons, detect overdue ones
2. **Create** `src/components/instructor/LessonEndAlert.tsx` — the overlay component
3. **Edit** `src/components/layout/InstructorPortalLayout.tsx` — mount the alert + wire up `EndLessonWizard` trigger

