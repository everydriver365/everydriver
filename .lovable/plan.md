

## Plan: Reduce Excessive Websocket Connections on Instructor Dashboard

### Problem
Your screenshot shows a flood of "gql" websocket requests (20+ ms each, constantly repeating). Each Supabase realtime `.channel().subscribe()` call opens a separate websocket subscription. The instructor dashboard and its layout collectively mount many components that each create their own channel — leading to excessive websocket traffic.

### Root Cause
Across the codebase, there are **66 files** creating realtime channels. On the `/instructor` page, the layout alone opens channels for:
- `useInstructorPresence` (presence channel)
- `usePaymentReceivedAlert` (payment_history changes)
- `useUrgentAlerts` (urgent_alerts changes)
- `useLessonEndAlert` (scheduled_lessons changes)
- `useOfflinePrefetch`
- `GapsFiller` (2 channels)
- `TodayScheduleView` / `TomorrowScheduleView`
- `PaymentSummaryWidget`
- `MessagesWidget`
- `RetentionAlertsTile`
- Plus any test swap, visitor chat, and other notification hooks

This easily exceeds 10-15 simultaneous channels on a single page.

### Solution: Consolidate Realtime Subscriptions

**Step 1: Create a shared realtime manager hook**
- Build `useRealtimeHub` — a single hook that opens ONE channel per table (or a small number of multiplexed channels)
- Components register their interest in specific table/event combinations
- The hub broadcasts changes to all registered listeners via a React context

**Step 2: Refactor the top consumers**
- Update the 8-10 hooks/components used on the dashboard to subscribe through the hub instead of creating individual channels
- Keep the cleanup logic (removeChannel) but centralized

**Step 3: Deduplicate channels with the same table**
- Many components listen to the same tables (`scheduled_lessons`, `payment_history`, `gps_devices`)
- Merge these into shared subscriptions that fan out to multiple consumers

### Technical Details

| File | Action |
|------|--------|
| `src/hooks/useRealtimeHub.tsx` | **Create** — context provider with a single multiplexed channel manager |
| `src/components/layout/InstructorPortalLayout.tsx` | **Modify** — wrap children in `RealtimeHubProvider` |
| `src/hooks/usePaymentReceivedAlert.ts` | **Modify** — use hub instead of own channel |
| `src/hooks/useGPSConnectionStatus.ts` | **Modify** — use hub |
| `src/components/instructor/GapsFiller.tsx` | **Modify** — use hub (currently opens 2 channels) |
| ~6 other dashboard hooks | **Modify** — similar refactor |

### Expected Result
- Websocket connections drop from 15+ to 3-5 multiplexed channels
- Reduced network overhead and faster page loads
- Same real-time functionality preserved

