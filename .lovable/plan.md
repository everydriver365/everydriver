

## Plan: Make "Action needed" tile reflect all alert types

### Problem

The top "Action needed" tile only counts **pending job offers**. Unread pupil messages, visitor chats, and test swap alerts are ignored, so the tile can read "You're all caught up" while the Messages widget below shows multiple unread items.

### Fix

Wire `WarmHomeTiles.tsx` into the same `useCombinedNotificationCount(instructorId)` hook used by `MessagesWidget`, then drive the tile from the highest-priority outstanding item.

### Priority order (highest first)

1. **Job offers** (time-sensitive SLA) → red, route `/instructor/jobs`
2. **Test alerts / swap requests** → red, route `/instructor/test-requests`
3. **Pupil messages** → red, route `/instructor/messages`
4. **Visitor chats** → red, route `/instructor/messages`
5. None of the above → existing "You're all caught up" empty state

### Tile copy per state

- Jobs: `{n} new job offer(s)` · `Respond within X hours` (existing logic preserved)
- Tests: `{n} test alert(s)` · `Tap to review`
- Pupil messages: `{n} unread message(s)` · `Tap to reply`
- Visitor chats: `{n} visitor chat(s)` · `Tap to reply`
- Empty: `NO PENDING ACTIONS` · `You're all caught up` (relabel from "NO PENDING OFFERS" so it's accurate)

If multiple categories have items, only the top-priority one is shown on the tile (the Messages widget below already itemises everything). The tile's label switches to `ACTION NEEDED` whenever any category > 0.

### Loading

Show the existing skeleton while either `useSoonestPendingOffer` or `useCombinedNotificationCount`'s underlying queries are still loading their first values.

### Files to edit

- `src/components/instructor/WarmHomeTiles.tsx` — replace the `hasOffers`-only branch with a priority resolver that consumes `useCombinedNotificationCount`. Tiles 2 (Up next) and 3 (Week at a glance) unchanged.

### QA at 390px on `/instructor`

- With only unread pupil messages → tile shows "X unread messages" and routes to `/instructor/messages`.
- With both job offers and messages → tile shows the job offer (higher priority).
- With nothing outstanding → "You're all caught up".
- Counts update live as new messages/jobs arrive (already handled by the hook's realtime subscriptions).

