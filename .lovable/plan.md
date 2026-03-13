

## Booking Flow UX Improvements

After auditing the current booking flow, here are the issues and improvements:

---

### 1. **No Form Validation Feedback** (High)
The `isPupilDetailsComplete` check is a basic truthy test — no email format validation, no phone format validation, no inline field errors. Users can enter "abc" as an email and still proceed to payment.

**Fix**: Add inline validation with error messages below each field. Validate email format (regex), phone format (UK mobile), and postcode format. Show red borders and helper text on blur.

### 2. **Bottom Bar "Pay Now" is Misleading** (Medium)
The sticky `BookingBottomBar` says "Pay Now" and scrolls to the payment section. But on first load, the user hasn't filled details yet — the button is disabled with no explanation why.

**Fix**: Change the button text dynamically: "Fill Your Details" → "Choose Lessons" → "Pay £X". This guides users through the flow without confusion.

### 3. **No Confetti / Celebration on Booking Confirmation** (Low)
The confirmation page has a nice hero but lacks the dopamine hit. `canvas-confetti` is already installed but not used on the confirmation page.

**Fix**: Fire confetti on mount when `paymentSuccessful` is true.

### 4. **Calendar Export Only Exports First Lesson** (Medium)
Both "Download .ics" and "Google Calendar" buttons only export the first lesson. Users with multi-lesson bookings lose all other dates.

**Fix**: Loop through all lessons and generate a single `.ics` with multiple `VEVENT` blocks, or download one per lesson. For Google Calendar, open multiple tabs or show a lesson picker.

### 5. **No Loading Skeleton on Booking Page** (Medium)
The booking summary shows nothing while loading instructor data — the whole page is blank until the fetch completes.

**Fix**: Add a skeleton state matching the header + form layout while `loading` is true.

### 6. **Payment Section Lacks Trust Signals** (Low)
No lock icon, no "256-bit encryption" badge, no payment provider logos near the card button. Trust signals reduce cart abandonment.

**Fix**: Add a small row of payment logos (Visa, Mastercard, Amex) and a lock icon with "Secure checkout" below the payment section.

---

### Proposed Changes

| File | Change |
|------|--------|
| `src/components/booking/MobileBookingView.tsx` | Add inline validation for email/phone/postcode with error messages. Change bottom bar text dynamically based on step. |
| `src/components/booking/BookingBottomBar.tsx` | Accept `step` prop to show contextual CTA text. |
| `src/pages/BookingConfirmation.tsx` | Fire `canvas-confetti` on successful payment. Export all lessons in calendar (not just first). |
| `src/pages/BookingSummary.tsx` | Add skeleton loading state. Add same validation logic for desktop. |
| `src/lib/calendar-export.ts` | Add `downloadMultiEventICS()` function for multi-lesson exports. |

