

## Problem

The `dismissedIdsRef` uses a `useRef` which resets every time the `InstructorPortalLayout` component remounts (e.g. on navigation). The 30-second polling interval then re-discovers the same overdue lesson and shows the alert again. Additionally, any lesson past its end time with status "scheduled/in_progress/arrived" will keep triggering indefinitely throughout the day.

## Plan

### 1. Persist dismissed IDs to sessionStorage
In `useLessonEndAlert.ts`, initialize the `dismissedIdsRef` from `sessionStorage` and write back on dismiss. This ensures dismissed lessons stay dismissed across navigation and re-renders within the same browser session.

### 2. Add a snooze mechanism
Instead of just "Dismiss", store a snooze timestamp. When dismissed, snooze that lesson for the rest of the day (or at minimum 2 hours). The check loop skips snoozed lessons.

### 3. Reduce polling aggression
Increase the polling interval from 30 seconds to 60 seconds — the alert is not so time-critical that it needs sub-minute checks.

### Technical Details

**File: `src/hooks/useLessonEndAlert.ts`**
- Read/write dismissed IDs from `sessionStorage` key `"dismissed-lesson-alerts"`
- On `dismiss()`, persist the updated set to sessionStorage
- Initialize ref from sessionStorage on mount
- Change interval from 30s to 60s

**File: `src/components/instructor/LessonEndAlert.tsx`**
- No changes needed

