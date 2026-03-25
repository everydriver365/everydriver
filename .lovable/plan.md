

## Merge Two Chat Systems Into One

Currently there are **two separate floating chat widgets** on every page:
- **LiveChatWidget** (bottom-right, green) — uses `live_chat_sessions` / `live_chat_messages` tables, has typing indicators, online status, quick reply flow, instructor/course cards, and calls `ai-receptionist` / `ai-admin-receptionist` edge functions
- **WhatsAppChatWidget** (bottom-left, primary) — uses `whatsapp_conversations` / `whatsapp_messages` tables, has the booking flow (postcode → course → results), and calls `whatsapp-webhook` edge function with SMS forwarding

The instructor inbox also has **two separate tabs** for these: "Visitors" (live chat) and "Enquiries" (whatsapp).

### Decision: Keep WhatsApp widget as the single widget, pull in Live Chat's best features

The WhatsApp/Chat widget already has: AI replies, booking flow, SMS forwarding, and conversation persistence. It's the more complete system. We'll merge the Live Chat's unique features into it.

### What gets merged in from Live Chat

1. **Typing indicators** — show "typing…" animation when AI/instructor is composing
2. **Online status** — show green dot + "Online now" when instructor is online (reuse `useInstructorOnlineStatus` hook)
3. **Quick reply suggestions** — the guided first-message flow from `QuickReplySuggestions` (step-by-step questions)
4. **Instructor & course cards** — `InstructorChatCards` and `CourseChatCards` that render rich cards inside AI responses

### Changes

**1. `src/components/whatsapp/WhatsAppChatWidget.tsx`**
- Import and use `useInstructorOnlineStatus` — show online dot in header
- Import `QuickReplySuggestions` from `live-chat/` — show before first message if no booking flow active
- Import `InstructorChatCards` and `CourseChatCards` — parse AI response messages for card data and render rich cards
- Add a simple typing indicator (reuse `TypingIndicator` component) triggered when waiting for AI response

**2. `src/components/layout/MainLayout.tsx`**
- Remove `LiveChatWidget` import and usage — only keep `WhatsAppChatWidget`

**3. `src/components/mini-website/MiniWebsiteLayout.tsx`**
- Remove `LiveChatWidget` import and usage — only keep `WhatsAppChatWidget`

**4. `src/pages/InstructorUnifiedInbox.tsx`**
- Remove the "Visitors" tab (which used `VisitorChatManager` for live chat sessions)
- Reduce tabs from 4 to 3: Pupils, Enquiries, Support
- The "Enquiries" tab (WhatsApp inbox) becomes the single place for all visitor conversations

**5. Route cleanup**
- Remove or redirect the standalone `InstructorVisitorChats` page since it's now redundant

### What stays unchanged
- All existing `whatsapp_conversations` / `whatsapp_messages` tables and realtime subscriptions
- The `whatsapp-webhook` edge function (AI + SMS forwarding)
- The booking flow (postcode → course → results)
- The `live_chat_*` tables remain in the database (no migration needed) — they just won't receive new data

### No database changes required

