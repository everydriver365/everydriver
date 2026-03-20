

## Fix: Lesson End Alert Blocking Wizard Completion

### Problem
When the End Lesson Wizard is open, the `useLessonEndAlert` hook continues polling every 60 seconds. If there are multiple overdue lessons (or the current one hasn't been marked complete in the database yet), a new `LessonEndAlert` overlay appears **on top of** the open wizard, blocking all interaction.

### Solution
Two changes in `InstructorPortalLayout.tsx`:

1. **Suppress the alert while the wizard is open** — don't render `LessonEndAlert` when `endWizardLesson` is not null (i.e. the wizard is active).

2. **After wizard completes, re-dismiss the just-completed lesson** — call `dismissLessonAlert` on completion so the same lesson doesn't immediately re-trigger before the DB status update propagates.

### Files Changed
- **`src/components/layout/InstructorPortalLayout.tsx`** — Conditionally render `LessonEndAlert` only when `endWizardLesson === null`. This is a ~1 line change in the JSX.

### Why This Works
The alert overlay uses `z-[100]` and covers the entire screen. By simply not rendering it while the wizard sheet is open, the instructor can complete each lesson uninterrupted. Once the wizard closes and sets `endWizardLesson` back to `null`, alerts resume normally for any remaining overdue lessons.

