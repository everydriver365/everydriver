# Fix: Profile page crashes with React error #310

## Root cause

`src/components/layout/InstructorPortalLayout.tsx` calls `useCombinedNotificationCount(instructor?.id)` at **line 1150**, but the component has two early returns before it:

- Line 624: `if (loading) return (...)`
- Line 641: `if (isMobile) return (...)`

When `loading` flips `true → false` or `isMobile` toggles, the number of hooks called between renders changes. React throws **error #310 — "Rendered more hooks than during the previous render."**

The component-level stack in the console confirms this — `useCombinedNotificationCount` is the hook that "appears" on the desktop render after the previous render didn't reach it.

This is unrelated to the new Profile v2 work — it's a pre-existing bug in the shared layout that surfaces on `/instructor/settings/profile` because of the loading → loaded transition for that page.

## Change

Move the `useCombinedNotificationCount` call up next to the other top-level hooks in `InstructorPortalLayout` (around line ~263, alongside `usePendingJobsCount()`), so it runs unconditionally on every render regardless of the `loading` / `isMobile` branches. The variable `notificationTotal` already used on line 1176 stays as-is.

No behavior change for users — same data, same prop passed to `DashboardShell`. Just hook order made stable.

## Files

- edit `src/components/layout/InstructorPortalLayout.tsx`
  - remove line 1150 `const { total: notificationTotal } = useCombinedNotificationCount(instructor?.id);`
  - re-add the same line up in the top hook block (after `const pendingCount = usePendingJobsCount();` on line 263)

## Verification

- Reload `/instructor/settings/profile` on desktop — page renders without the error boundary.
- Resize across the 768px breakpoint — no crash.
- Notification bell badge still updates.
