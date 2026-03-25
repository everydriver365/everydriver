

## Fix: "View & Book" should navigate to the booking page, not the course search page

### Problem
When a user clicks "View & Book" on a chat result card, they are sent to `/i/:slug/courses?postcode=...&hours=...&date=...` — which is a search/discovery page. The user expects to land on the actual booking page for that specific instructor and course.

### Solution
Change the navigation in `handleBookingCardSelect` to go to `/book/:instructorId` instead — the dedicated booking summary page that already accepts `hours` and `date` query params.

### Changes

**File: `src/components/whatsapp/WhatsAppChatWidget.tsx`** (~line 449-454)

Update `handleBookingCardSelect` to navigate to the booking page:

```typescript
const handleBookingCardSelect = (result: BookingResult) => {
  const dateStr = format(result.nextAvailable, "yyyy-MM-dd");
  navigate(`/book/${result.instructorId}?hours=${result.hours}&date=${dateStr}`);
};
```

This sends the user directly to the `BookingSummary` page with the correct instructor, hours, and date pre-selected — no intermediate search step.

