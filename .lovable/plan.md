

# Wire Realtime Lesson Sync Across the Entire Instructor App

## Problem
When a lesson is added (e.g. from the Schedule page), the home page and other views still show stale data because only `InstructorMobileHome.tsx` subscribes to `scheduled_lessons` changes — and only while it's mounted. Other pages like Schedule, Pupil Detail, and Gaps don't propagate changes back to shared query caches.

## Root Cause
- Realtime subscription for `scheduled_lessons` lives inside `InstructorMobileHome.tsx` (component-level), so it only runs when that page is active
- The `AddLessonSheet` `onSuccess` only calls `calendar.refetch()` locally — doesn't invalidate home-page query keys
- No global listener exists to keep all lesson-dependent queries in sync

## Solution: Global Realtime Lesson Sync Hook

### 1. Create `useGlobalLessonSync.ts`
A new hook that subscribes to `scheduled_lessons` changes via the RealtimeHub and invalidates **all** lesson-related query keys app-wide. This runs at the layout level so it's always active.

Query keys to invalidate on any `scheduled_lessons` change:
- `today-overview`, `today-remaining-lessons`, `next-lesson-details`
- `weekly-goals`, `monthly-goals`, `instructor-streak`
- `tomorrow-preview`, `tomorrow-lessons`, `gap-suggestions`
- `instructor-calendar`, `instructor-live-stats`
- `break-reminders`, `lesson-end-alert`, `today-route`
- `quick-tile-actions`, `gap-slots`

### 2. Mount the hook in `InstructorPortalLayout.tsx`
Call `useGlobalLessonSync(instructorId)` inside the layout component (inside the `RealtimeHubProvider`). This ensures the subscription is active on every instructor page.

### 3. Remove duplicate subscription from `InstructorMobileHome.tsx`
Delete the `invalidateScheduleQueries` callback and `useRealtimeSubscription` call from InstructorMobileHome since the layout now handles it globally.

### 4. Also subscribe to `pupils` and `lesson_history` changes
These tables affect dashboard stats (earnings, balances, progress). Add two more subscriptions in the global hook to invalidate relevant keys when pupil data or lesson history changes.

## Files to modify
- **Create** `src/hooks/useGlobalLessonSync.ts` — New hook with realtime subscriptions + query invalidation
- **Edit** `src/components/layout/InstructorPortalLayout.tsx` — Import and call the new hook
- **Edit** `src/components/instructor/InstructorMobileHome.tsx` — Remove the now-redundant realtime subscription block

