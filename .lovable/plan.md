

## Problem

The AI receptionist edge function is working correctly (confirmed by direct testing — it returns proper responses). The issue is that the user is testing with a **stale chat session from before the fix was deployed**.

The previous chat session has:
1. Quick reply steps already completed (stored in localStorage as `quick_reply_step_{sessionId}`)
2. Old failed AI calls in the conversation history
3. The session ID stored in localStorage, so reopening the widget reuses the broken session

## Fix

**1. Add a "New Chat" / reset button to the chat widget** so users can start fresh sessions without manually clearing browser storage.

In `LiveChatWindow.tsx`, add a reset/end chat option that:
- Clears the localStorage session (`live_chat_session_*` and `quick_reply_step_*`)
- Resets state back to the pre-chat form

**2. Add better error feedback in the chat** — when the AI receptionist call fails or returns an error, show a visible message to the visitor instead of silently failing.

In `LiveChatWindow.tsx` `triggerAIReceptionist`:
- Check the response for errors
- If error, insert a local "sorry" message so the user knows something went wrong

**3. Reduce the AI trigger delay from 5 seconds to 2 seconds** for a more responsive feel, especially for the postcode step where there's no human expected to reply.

### Files to change:
- `src/components/live-chat/LiveChatWindow.tsx` — add error handling to `triggerAIReceptionist`, reduce delay to 2s
- `src/components/live-chat/LiveChatWidget.tsx` — add "New Chat" reset functionality
- `src/components/live-chat/EmbeddedLiveChat.tsx` — same reset functionality

