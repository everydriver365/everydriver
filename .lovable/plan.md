

## Add proactive chat popup on mini-website

### What it does
After 10 seconds on any instructor mini-website, a small animated speech bubble appears above the chat button with a friendly message like "👋 Hi! Need help finding the right course?". Clicking it opens the chat widget. It dismisses on its own after 8 seconds or if the user closes it, and won't re-appear for that visitor (stored in localStorage).

### Changes

**`src/components/whatsapp/WhatsAppChatWidget.tsx`**

1. Add a `showProactiveBubble` state, defaulting to `false`
2. Add a `useEffect` with a 10-second `setTimeout` that:
   - Checks localStorage for a `proactive_chat_dismissed_{instructorId}` key — if set, skips
   - Only fires if `!isOpen && !isMinimized && !conversationId` (no active session)
   - Sets `showProactiveBubble = true`
3. Add an 8-second auto-dismiss timer when the bubble is shown
4. Render an animated speech bubble (using `framer-motion`) positioned above the floating chat button (bottom-left), containing:
   - A short message: "👋 Hi! Need help finding the right course?"
   - A small "×" dismiss button
   - Click on the bubble text opens the chat widget
5. On dismiss (click × or auto-timeout): set localStorage flag and hide the bubble
6. When `isOpen` becomes true, hide the bubble

No new files or database changes needed — this is a purely client-side UI addition within the existing widget component.

