

## Add Calendar Sync Queue Dashboard to Admin Portal

### Overview
Create a new admin section showing all `calendar_sync_queue` items grouped by status (pending, failed, processed), with retry capability for failed items.

### New Component
**`src/components/admin/CalendarSyncQueueManager.tsx`**

A tabbed dashboard with three views:
- **Pending** — `processed_at IS NULL` — items waiting to be synced
- **Failed** — `processed_at IS NOT NULL AND error IS NOT NULL AND error != 'Deduplicated'` — items that errored
- **Processed** — `processed_at IS NOT NULL AND (error IS NULL OR error = 'Deduplicated')` — successfully completed

Each row shows: instructor name (joined from `instructors`), lesson ID, action type, created time, processed time, error message.

**Retry button** on failed items: resets `processed_at` and `error` to `null` so the next queue run picks them up again. Uses a direct update via Supabase client.

**Bulk retry** button to reset all failed items at once.

Auto-refreshes every 30 seconds. Manual refresh button. Shows counts in tab badges.

### Admin Portal Integration
**`src/pages/AdminPortal.tsx`**:
- Add `"calendar-sync"` to `sectionMeta` under "System Settings" group with `Calendar` icon
- Add case in `renderContent` switch to render `<CalendarSyncQueueManager />`
- Import the new component

### RLS Consideration
The admin uses authenticated queries. The `calendar_sync_queue` table needs a SELECT policy for admin users and an UPDATE policy for retry. Will add two RLS policies using the `has_role` function.

### Database Changes
- Add RLS policy: admins can SELECT from `calendar_sync_queue`
- Add RLS policy: admins can UPDATE `calendar_sync_queue` (for retry — clearing `processed_at` and `error`)

### Files
- **New**: `src/components/admin/CalendarSyncQueueManager.tsx`
- **Modified**: `src/pages/AdminPortal.tsx` — add section metadata + switch case

