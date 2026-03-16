

## Messaging System Audit - Issues Found & Fix Plan

### Issues Identified

**1. Pupil queries include archived (soft-deleted) pupils**
- `InstructorInbox.fetchPupils()` (line 155-159) and `BroadcastMessageSheet.fetchPupils()` (line 75-79) both query pupils without filtering `.is("deleted_at", null)`. This means archived/deleted pupils appear in "New Chat" and "Broadcast" recipient lists.

**2. `markAsRead` infinite re-render loop in AdminChatWindow**
- `AdminChatWindow.tsx` line 31-33 calls `markAsRead()` inside `useEffect` with `[markAsRead]` as dependency. But `markAsRead` in `useInstructorAdminChat` (line 109) is NOT wrapped in `useCallback`, so it gets a new reference every render, causing an infinite loop of update calls. Same issue with `AdminChatView` in `AdminInstructorMessagesManager.tsx` (line 159-161).

**3. `markAsRead` not memoized in `useAdminMessaging.ts`**
- Both `markAsRead` functions (line 109 and line 316) in `useAdminMessaging.ts` are plain `async` functions, not wrapped in `useCallback`. This causes the infinite loop described above and unnecessary re-renders.

**4. `useCombinedNotificationCount` doesn't filter soft-deleted messages**
- Line 22-28: The unread pupil message count query doesn't include `.is("deleted_at", null)`, so soft-deleted messages still count toward unread badges.

**5. `MessageNotificationBadge` doesn't filter soft-deleted messages**
- Line 30-35: Same issue -- counts all unread pupil messages including soft-deleted ones.

**6. Duplicate realtime channel names cause conflicts**
- `VisitorChatBadge` uses channel name `"visitor-chat-unread"` and `useVisitorChatUnreadCount` uses `"visitor-chat-unread-${instructorId}"`. If multiple instructors were logged in (unlikely but possible) the static name would conflict. More critically, `MessageNotificationBadge` uses static `"unread-messages"` which could conflict across component instances.

**7. `InstructorDirectChat` missing `markAsRead` dependency**
- Line 31-33: `useEffect(() => { markAsRead.mutate(); }, [messages.length])` is missing `markAsRead` from the dependency array (React lint warning), though functionally this is actually fine since calling on message length change is the intended behavior.

### Fix Plan

**File: `src/hooks/useAdminMessaging.ts`**
- Wrap both `markAsRead` functions (instructor hook line 109 and admin hook line 316) in `useCallback` with appropriate dependencies (`conversation?.id`, `instructorId`, `conversationId`).

**File: `src/components/instructor/InstructorInbox.tsx`**
- Add `.is("deleted_at", null)` to the pupils query at line 158.

**File: `src/components/instructor/BroadcastMessageSheet.tsx`**
- Add `.is("deleted_at", null)` to the pupils query at line 78.

**File: `src/hooks/useCombinedNotificationCount.ts`**
- Add `.is("deleted_at", null)` to the unread messages count query at line 24.

**File: `src/components/instructor/MessageNotificationBadge.tsx`**
- Add `.is("deleted_at", null)` to the unread messages count query at line 32.

**File: `src/components/instructor/MessageNotificationBadge.tsx`**
- Change static channel name `"unread-messages"` to include instructor ID for uniqueness.

**File: `src/components/instructor/VisitorChatBadge.tsx`**
- Change static channel name `"visitor-chat-unread"` to include instructor ID.

This addresses all functional bugs -- the most impactful being the `markAsRead` infinite loop which wastes database calls and the deleted pupil visibility issue.

