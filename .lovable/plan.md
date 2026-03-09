

## Add AI Auto-Responder to Admin Live Chat

### Overview
Create an AI-powered auto-responder for the admin live chat (Drive365 Help page). When a visitor sends a message and no admin replies within 5 seconds, the AI will auto-respond with helpful answers about EveryDriver/Drive365.

### Changes

**1. New Edge Function: `supabase/functions/ai-admin-receptionist/index.ts`**
- Mirrors the existing `ai-receptionist` pattern but tailored for admin chat
- System prompt covers general EveryDriver/Drive365 topics: finding instructors, booking courses, account help, pricing
- Fetches conversation history for context
- Inserts AI reply as an `admin` sender with 🤖 prefix
- Handles rate limiting (429) and payment errors (402)

**2. Update `supabase/config.toml`** (if needed)
- Add `[functions.ai-admin-receptionist]` with `verify_jwt = false`

**3. Update `src/components/live-chat/LiveChatWindow.tsx`**
- Add a new `triggerAdminAIReceptionist` function that invokes the new edge function for admin sessions
- Modify the existing AI trigger logic: currently only fires when `instructorId` is set. Extend it to also fire for admin sessions (when `userType === "visitor"` and no `instructorId`)
- Keep the same 5-second delay and cancellation-on-human-reply logic

### How It Works
1. Visitor opens Help chat → sends message
2. 5-second timer starts
3. If admin replies within 5s → timer cancelled, no AI response
4. If no admin reply → edge function called → AI responds with helpful EveryDriver info
5. AI response appears as a chat message with 🤖 prefix

