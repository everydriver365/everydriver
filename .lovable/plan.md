

# Add Notification Badges to Messages & Visitor Chats Tiles

## What changes
Add red unread-count badges to both the **Messages** tile and the **Visitor Chats** tile in Quick Actions, matching the existing pattern used for pending jobs badges.

## How it works

### 1. Add helper functions to identify the tiles
In `QuickActionTiles.tsx`, add two new tile-type checkers (following the existing `isJobOffersAction` pattern):

```text
isMessagesAction(action)  -> matches route "/instructor/messages"
isVisitorChatsAction(action) -> matches route "/instructor/visitor-chats"
```

### 2. Fetch unread counts
Import and use the existing hooks:
- `useUnreadMessagesCount(instructorId)` for pupil messages
- Create a similar inline query (or lightweight hook) for visitor chat unread count using the same pattern from `VisitorChatBadge.tsx`

### 3. Render badges on tiles
In both the full-width first tile and the 2-column grid tiles, add badge rendering for Messages and Visitor Chats tiles -- same red destructive badge style already used for job offers.

## Files to modify

| File | Change |
|------|--------|
| `src/components/instructor/QuickActionTiles.tsx` | Import `useUnreadMessagesCount`, add visitor chat count query, add `isMessagesAction`/`isVisitorChatsAction` helpers, render badges on matching tiles in both view modes (edit + normal) |

## Technical details

- Reuse `useUnreadMessagesCount` hook (already exists at `src/hooks/useUnreadMessagesCount.ts`)
- For visitor chats, add a small `useVisitorChatUnreadCount` hook or inline the query (to keep it consistent, a small hook is cleaner)
- Badge style matches existing: `bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full`
- Badges show on both the first (full-width) tile and the smaller grid tiles, just like job offers badges do today

