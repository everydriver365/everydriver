

## Plan: AI WhatsApp Auto-Reply with Pricing & Availability

### What It Does
When a prospect messages the instructor's WhatsApp number, AI automatically replies with pricing, availability, and course info — pulling live data from the database. The instructor gets notified and can take over at any time.

This complements in-app messaging rather than replacing it:
- **WhatsApp AI** → catches new enquiries 24/7 (prospects who don't have your app)
- **In-app messaging** → manages existing pupil relationships

### Architecture

```text
Prospect sends WhatsApp message
        ↓
Meta Webhook → whatsapp-webhook edge function
        ↓
  ┌─ Log message to whatsapp_conversations table
  ├─ Look up instructor by phone number
  ├─ Check ai_receptionist_enabled toggle
  ├─ Query live data (pricing, availability, courses)
  └─ AI generates reply → send via WhatsApp API
        ↓
  Instructor sees conversation in Unified Inbox
  (can take over manually at any time)
```

### Database Changes

**New table: `whatsapp_conversations`**
- `id`, `instructor_id`, `phone_number`, `visitor_name`
- `ai_enabled` (boolean, default true — instructor can disable per-conversation)
- `last_message_at`, `created_at`

**New table: `whatsapp_messages`**
- `id`, `conversation_id`, `direction` (inbound/outbound)
- `content`, `sender_type` (visitor/ai/instructor)
- `created_at`
- Enable realtime for live updates

### Edge Function: `whatsapp-webhook`

Handles both GET (Meta verification) and POST (inbound messages):

1. **GET** — Returns the hub challenge for Meta webhook verification
2. **POST** — Processes inbound messages:
   - Extract sender phone number and message text
   - Find instructor by matching WhatsApp phone number
   - Check `ai_receptionist_enabled` toggle
   - Log the inbound message
   - Query instructor's live data:
     - `instructors` → pricing, car details, areas
     - `instructor_courses` → course packages and prices
     - `scheduled_lessons` + `instructor_working_hours` → next available slots
   - Call Lovable AI (Gemini) with context to generate a natural reply
   - Send reply via WhatsApp Business API
   - Log the outbound AI message
   - If AI can't handle the query → notify instructor via push/in-app

### System Prompt Context (what AI knows)

The AI will have access to:
- Instructor name, phone, hourly rate, car details
- All course packages with prices and durations
- Next 5 available booking slots (calculated from working hours minus booked lessons)
- Service areas (from postcode)
- Existing conversation history for context

### Unified Inbox Integration

| File | Change |
|------|--------|
| `src/pages/InstructorUnifiedInbox.tsx` | Add 4th tab: "WhatsApp" with badge showing unread count |
| `src/components/instructor/WhatsAppInbox.tsx` | New component — list of WhatsApp conversations with last message preview |
| `src/components/instructor/WhatsAppChat.tsx` | New component — chat view for a single WhatsApp conversation. Shows AI vs instructor messages differently. Toggle to disable AI for this conversation and reply manually |

### Instructor Controls

- Existing `ai_receptionist_enabled` toggle controls whether AI replies to WhatsApp
- Per-conversation "Take over" button disables AI for that specific chat
- AI messages are prefixed with 🤖 so the instructor can see what was sent
- Smart handoff: if the prospect asks something the AI can't answer, it says "Let me get [instructor name] to help you with that" and flags the conversation

### New Secret Needed
`WHATSAPP_VERIFY_TOKEN` — a custom string the instructor sets in their Meta webhook configuration (for webhook verification handshake)

### Files Changed

| File | Change |
|------|--------|
| **Migration** | Create `whatsapp_conversations` and `whatsapp_messages` tables with RLS |
| `supabase/functions/whatsapp-webhook/index.ts` | New edge function handling inbound WhatsApp messages + AI reply |
| `src/pages/InstructorUnifiedInbox.tsx` | Add WhatsApp tab |
| `src/components/instructor/WhatsAppInbox.tsx` | New — conversation list |
| `src/components/instructor/WhatsAppChat.tsx` | New — chat window with manual takeover |
| `src/hooks/useWhatsAppConversations.ts` | New — fetch conversations + realtime |
| `src/hooks/useWhatsAppMessages.ts` | New — fetch messages for a conversation + realtime |

