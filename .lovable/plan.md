

# Add Test Swap Alert Bell to Instructor Mobile Header

## What This Does

Adds a notification bell icon to the instructor mobile app header that shows a red badge when there are new test swap offers or matching tests available. Tapping it navigates directly to the Test Swap page.

## How It Works

1. **New hook: `useTestSwapNotifications`** -- Queries the database for:
   - Pending swap offers on the instructor's test requests (someone offered them a test)
   - New active "have_test" requests on the swap board that match what the instructor's pupils want
   - Polls every 30 seconds and listens via realtime for instant updates

2. **Header update** -- A bell icon button is added to the right-side action buttons in `InstructorMobileHeader.tsx`. When there are unread notifications, a small red dot/count badge appears on the bell. Tapping it navigates to `/instructor/test-requests`.

## Technical Details

### New File: `src/hooks/useTestSwapNotifications.ts`

A React Query hook that:
- Counts `test_swap_offers` with status `'pending'` linked to `test_requests` where `instructor_id` matches the current instructor
- Counts new active `test_requests` with `request_type = 'have_test'` posted by other instructors (potential matches)
- Returns `{ count: number }` for the badge
- Uses a 30-second refetch interval
- Subscribes to realtime changes on `test_swap_offers` table for instant updates

### Modified File: `src/components/instructor/InstructorMobileHeader.tsx`

- Import the new `useTestSwapNotifications` hook
- Add a bell button between the OfflineSyncIndicator and the Pay button
- Show a red badge with the count when count > 0
- On click, navigate to `/instructor/test-requests`

| File | Change |
|------|--------|
| **New** `src/hooks/useTestSwapNotifications.ts` | Hook to query pending offers and matching requests |
| `src/components/instructor/InstructorMobileHeader.tsx` | Add bell icon with notification badge |

