
# Messages & Alerts Widget - Separate Clickable Sections

## Overview
Redesign the MessagesWidget to show separate, clickable rows for each alert category instead of a single summary line. Each row will display an icon, label, count badge, and link to the relevant page.

## Changes

### File: `src/components/instructor/dashboard/MessagesWidget.tsx`

Replace the current layout (header + recent conversations list) with a structured list of 4 clickable alert rows:

1. **Pupil Messages** - icon: MessageSquare, count from `pupilMsgCount`, links to `/instructor/messages`
2. **Admin / Visitor Chats** - icon: MessageCircle or Headset, count from `visitorChatCount`, links to `/instructor/messages`
3. **Job Offers** - icon: Briefcase, count from `pendingJobsCount`, links to `/instructor/jobs`
4. **Test Alerts** - icon: Award/CalendarCheck, count from `swapCount`, links to `/instructor/test-requests`

Each row will be a clickable Link with:
- Left: coloured icon in a rounded container
- Middle: label text + subtitle (e.g. "2 unread" or "No new alerts")
- Right: count badge (red if > 0) + chevron arrow

The overall card header ("Messages & Alerts" with total badge) will remain at the top.

Remove the recent conversations list (the full conversation view is accessible from the Messages page).

### Technical Details

- No new dependencies or database changes needed
- Reuses existing `useCombinedNotificationCount` hook (already provides all 4 counts)
- Remove the `useQuery` for recent conversations since the widget will now show category rows instead
- Each row uses `Link` from react-router-dom pointing to the correct route
- Styling: consistent with existing widget card patterns, hover states on rows
