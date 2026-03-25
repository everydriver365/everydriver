

## Remove WhatsApp Dependency — Use In-App Chat + SMS Notifications

The good news: the chat widget already works as a fully in-app system. Messages are stored in your database, AI replies work, and instructors can see all conversations in their inbox. The only thing that breaks is the Meta API forwarding (because the app isn't approved).

### What Changes

**1. Edge function: Replace WhatsApp forwarding with SMS via Twilio**
- In `supabase/functions/whatsapp-webhook/index.ts`, replace the `sendWhatsAppMessage` function with a `sendSMSNotification` function that uses your existing Twilio credentials (already configured: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`)
- When a visitor sends a message, the instructor gets an SMS like: "New enquiry from John: 'How much are lessons?' — Reply in your dashboard"
- Handoff requests also go via SMS instead of WhatsApp
- Rate-limit SMS notifications to avoid spamming (max 1 SMS per conversation per 10 minutes)

**2. Rebrand the widget UI from "WhatsApp" to "Chat"**
- `src/components/whatsapp/WhatsAppChatWidget.tsx`: Replace the WhatsApp icon with a generic `MessageCircle` icon, change the green `#25D366` colour to match the site brand, update header text from "WhatsApp Chat" to the instructor name or "Chat with us"
- Update suggestion chip styles accordingly

**3. Rebrand the instructor inbox**
- `src/components/instructor/WhatsAppInbox.tsx`: Change the empty-state text from "No WhatsApp conversations" to "No enquiries yet" and "When prospects message you, conversations will appear here"
- Update the tab label if referenced elsewhere

**4. No database changes needed**
- The existing `whatsapp_conversations` and `whatsapp_messages` tables continue to work as-is — they're just chat tables regardless of name
- Realtime subscriptions, AI replies, and the booking flow all remain untouched

### Technical Details

The SMS notification in the edge function will look like:

```typescript
async function sendSMSNotification(to: string, text: string) {
  const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  if (!TWILIO_SID || !TWILIO_TOKEN) return;

  const params = new URLSearchParams();
  if (TWILIO_MSG_SID) params.append("MessagingServiceSid", TWILIO_MSG_SID);
  params.append("To", to);
  params.append("Body", text);

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}
```

### Files Modified
- `supabase/functions/whatsapp-webhook/index.ts` — swap WhatsApp forwarding for SMS
- `src/components/whatsapp/WhatsAppChatWidget.tsx` — rebrand UI
- `src/components/instructor/WhatsAppInbox.tsx` — rebrand empty states

