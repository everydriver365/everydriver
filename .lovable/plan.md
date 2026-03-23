

## Plan: WhatsApp as Primary Messaging Channel with In-App Fallback

### What's Changing
When an instructor sends a message to a pupil, it defaults to WhatsApp (via the `send-whatsapp` edge function) if the pupil has a phone number. If no phone number or WhatsApp fails, it falls back to in-app messaging. All conversations remain visible in the Unified Inbox.

### Changes

| File | Change |
|------|--------|
| `src/hooks/useWhatsAppMessages.ts` | Update `sendMessage` mutation to call the `send-whatsapp` edge function (which already handles WhatsApp → SMS fallback) when sending outbound messages, in addition to logging them in `whatsapp_messages` |
| `src/components/instructor/QuickMessageSheet.tsx` | Replace the `sms:` link default with a call to `send-whatsapp` edge function. If pupil has a phone number, send via WhatsApp; otherwise fall back to in-app. Show "Sent via WhatsApp" / "Sent via SMS" feedback |
| `src/components/instructor/InstructorInbox.tsx` | Add a "Send via WhatsApp" toggle or auto-detect: when composing a message to a pupil with a phone number, route through WhatsApp instead of in-app only. Add a small WhatsApp icon indicator on messages sent via WhatsApp |
| `src/components/instructor/ChatWindow.tsx` | Add a WhatsApp send option — if the pupil has a phone number, show a toggle to send via WhatsApp vs in-app. Messages sent via WhatsApp get logged in both `whatsapp_messages` and shown in the chat thread |
| `supabase/functions/send-whatsapp/index.ts` | Minor update: also log outbound messages to `whatsapp_messages` table and create/update `whatsapp_conversations` entry so they appear in the WhatsApp tab |

### Message Routing Logic

```text
Instructor sends message
    ↓
Pupil has phone number?
  YES → Call send-whatsapp edge function
        → Log in whatsapp_messages + whatsapp_conversations
        → Also log in conversations table for in-app history
        → Show "Sent via WhatsApp ✓" in chat
  NO  → Send via in-app messaging only (existing flow)
```

### Quick Message Sheet Update
The `QuickMessageSheet` (used from lesson cards for "On my way", "5 mins late" etc.) currently opens the native SMS app. It will instead call the `send-whatsapp` edge function directly, giving instant delivery via WhatsApp with SMS fallback — no need to leave the app.

### No database changes needed
Both `whatsapp_conversations` and `whatsapp_messages` tables already exist. The `send-whatsapp` edge function already handles WhatsApp → SMS fallback.

