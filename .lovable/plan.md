

## Open booking flow without leaving the chat conversation

### Problem
Currently, clicking "View & Book" on a course card in the chat widget calls `navigate()`, which navigates away from the page and closes the chat entirely. The user loses their conversation context.

### Solution
Open the booking page in a new browser tab instead of navigating in the same tab. This keeps the chat conversation active while the visitor can complete their booking in the new tab. Also apply the same pattern to the `CourseChatCards` component used in the live chat.

### Changes

**`src/components/whatsapp/WhatsAppChatWidget.tsx`**
1. Change `handleBookingCardSelect` (line 483-486) to use `window.open()` with `_blank` instead of `navigate()`:
   ```ts
   const handleBookingCardSelect = (result: BookingResult) => {
     const dateStr = format(result.nextAvailable, "yyyy-MM-dd");
     window.open(`/book/${result.instructorId}?hours=${result.hours}&date=${dateStr}`, '_blank');
   };
   ```
2. Add a brief confirmation message in the chat after clicking, e.g. "📋 Booking page opened in a new tab!"

**`src/components/live-chat/CourseChatCards.tsx`**
- Already uses `target="_blank"` on the `<motion.a>` links — no change needed here.

### Summary
Single function change in the widget. The booking page opens in a new tab so the visitor keeps their chat conversation open and can return to it.

