

## Plan: Global WhatsApp Chat Widget on All Pages

### What's Changing
Create a floating WhatsApp chat button (green FAB) that appears on all public-facing pages. When clicked, it opens an in-app chat window that sends messages through the existing WhatsApp webhook/AI system.

### Approach

The existing `LiveChatWidget` pattern is the perfect template — a floating button that opens a chat window. We'll create a similar `WhatsAppChatWidget` component and add it to the two main layouts.

### Files

| File | Change |
|------|--------|
| `src/components/whatsapp/WhatsAppChatWidget.tsx` | **New** — Floating WhatsApp FAB (green, bottom-left to avoid conflicting with existing live chat on bottom-right). Opens an in-app chat window. Collects visitor name + phone on first message, then sends/receives via `whatsapp-webhook` edge function. Shows AI responses in real-time. |
| `src/components/layout/MainLayout.tsx` | Add `<WhatsAppChatWidget />` alongside existing `LiveChatWidget` |
| `src/components/mini-website/MiniWebsiteLayout.tsx` | Add `<WhatsAppChatWidget />` with the instructor's ID and WhatsApp number so messages route to the correct instructor |

### Widget Behaviour

- **Position**: Bottom-left corner (existing live chat is bottom-right)
- **Icon**: WhatsApp branded green (#25D366) with WhatsApp SVG icon
- **Pre-chat**: Simple form asking for name and phone number
- **Chat**: Messages sent to `whatsapp-webhook` edge function, AI replies displayed in the widget
- **On mini-websites**: Routes to the specific instructor's WhatsApp AI
- **On main site**: Routes to admin/general enquiries
- **Mobile**: Positioned above the bottom nav bar

### No database changes needed
Uses existing `whatsapp_conversations` and `whatsapp_messages` tables + `whatsapp-webhook` edge function.

