## Why the bell shows nothing

The bell in the mobile home hero (`MobileHomeDSM2026.tsx`) is wired to `useUnreadMessagesCount(instructorId)` (variable `msgsCount`, line 191 → passed as `unreadCount` on line 305 → rendered as `badge` on line 785).

That hook only counts unread pupil chat messages. It does **not** read the `instructor_notifications` table — which is where the actual alerts live (the same data the `/instructor/notifications` page shows via `useInstructorNotifications`, and the same data shown elsewhere in the app via `useCombinedNotificationCount`).

So unless the instructor has an unread pupil message, the bell stays badge-less even when there are real notifications waiting.

## Fix

Switch the home bell badge to a notification-aware source. Two reasonable options:

1. **Match the `/instructor/notifications` page exactly** — use `useInstructorNotifications(instructorId).unreadCount`. The badge then mirrors the page the bell navigates to.
2. **Match every other header in the app** — use `useCombinedNotificationCount(instructorId).total` (messages + visitor chats + pending course enquiries + test swap requests). This is what `MobileBlueHeader` and `ScheduleMobileChrome` already use, so the badge would be consistent across the portal.

Recommendation: **option 2** for consistency with the rest of the portal headers, plus add `instructor_notifications` unread count into `useCombinedNotificationCount` so true "alert" rows are included too (currently that hook ignores the `instructor_notifications` table).

## Changes

- `src/hooks/useCombinedNotificationCount.ts`: also count unread rows in `instructor_notifications` for the instructor, subscribe to its realtime channel, add to `total`.
- `src/components/instructor/MobileHomeDSM2026.tsx`: replace `useUnreadMessagesCount` usage feeding the bell badge with `useCombinedNotificationCount(instructorId).total`. Leave `msgsCount` in place for anywhere else it's used (todoCount, enquiries, etc.) — only the bell's `unreadCount` prop changes.

## Verification

- Insert a test row into `instructor_notifications` with `is_read = false` for the signed-in instructor → bell badge on `/instructor` increments within ~1s (realtime), tap navigates to `/instructor/notifications` where the same row is listed.
- Mark it read on that page → badge clears.