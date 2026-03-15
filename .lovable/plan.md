

# Payment & Booking Flow Improvements

After auditing the full booking flow (`MobileBookingView.tsx` — 973 lines), payment drawer (`PupilPaymentDrawer.tsx`), confirmation page (`BookingConfirmation.tsx` — 640 lines), and all payment components, here are the gaps and proposed fixes.

---

## Issues Found

### Booking Flow

1. **No order summary before payment** — The user fills details, schedules lessons, then lands directly on payment buttons. There's no "Review your order" step showing a consolidated summary (course, schedule, upsells, total). Every major e-commerce checkout (Stripe Checkout, Shopify, Uber) shows a review step. This reduces buyer's remorse and support disputes.

2. **No real-time price breakdown visible during scheduling** — The bottom bar shows total price but doesn't update to show deposit vs full, upsell itemisation, or admin fee. The user only sees the breakdown inside the payment card.

3. **Upsells are buried below the scheduler** — `UpsellSelector` renders inside the payment section (step 3). Best practice is to show upsells between step 1 (details) and step 2 (schedule), or as an interstitial, to catch higher intent. Amazon, Booking.com show add-ons before payment.

4. **No booking timer/urgency** — Popular slots have no visual urgency. Competitors show "3 people looking at this" or a session timer ("complete booking within 15 minutes to hold your slot"). This could be a subtle countdown timer in the header.

5. **Confirmation page has no sharing/referral prompt** — The confirmation page shows lessons, instructor, and calendar export — but no "Share with friends" or referral prompt. Given there's already a referral system in the pupil portal, this is a missed conversion opportunity.

6. **No email capture for abandoned bookings** — Form state saves to `localStorage` and shows a recovery banner, but if the user entered their email and left, there's no server-side record to follow up. The email is only stored client-side.

### Payment Flows

7. **Pupil payment drawer doesn't show payment history** — The drawer opens with amount + method selection but doesn't show recent payments or remaining balance context. The parent portal's `ParentPaymentTopUp` shows "Current Balance" prominently, but the pupil drawer only shows "Balance owed" in small text.

8. **No payment receipt/confirmation in pupil portal** — After a pupil makes a payment via the drawer, there's a toast notification but no receipt screen or downloadable receipt. Parents get redirected with `?payment=success` but pupils just see a toast.

9. **Booking confirmation page isn't mobile-optimised** — It uses `MainLayout` with full header/footer, creating a desktop-first layout. On mobile (where most bookings happen), the sidebar stacks below the main content, pushing the "Go to Dashboard" CTA far down the page.

---

## Proposed Improvements

### 1. Add Order Review Summary before Payment
Insert a collapsible "Review Your Booking" card between the schedule step and the payment step. Show:
- Course name, hours, price
- Selected lesson dates/times (summarised)
- Selected upsells with line items
- Deposit vs full payment breakdown
- Total with admin fee

### 2. Move Upsells to a Dedicated Step
Move `UpsellSelector` out of the payment section and into its own interstitial between Details and Schedule (or Schedule and Payment). Show it as a full-width section with "Skip" option.

### 3. Add Abandoned Booking Email Capture
After the user fills in their email (step 1), fire a lightweight edge function call to store `{email, instructorId, courseName, timestamp}` in a `booking_drafts` table. This enables follow-up emails without requiring full booking completion.

### 4. Add Referral Prompt to Confirmation Page
After the calendar export section, add a "Know someone learning to drive?" card with a share button that generates a referral link using the existing referral system.

### 5. Mobile-Optimise Confirmation Page
On mobile, restructure the confirmation page to show:
- Success hero (keep)
- CTA buttons moved to top (Dashboard, Theory)
- Lessons as a swipeable horizontal list or compact accordion
- Instructor contact as a sticky bottom bar
- Remove the sidebar layout on mobile

### 6. Add Payment Confirmation Screen to Pupil Drawer
After successful payment redirect, show a brief "Payment Received" confirmation card within the pupil portal with amount, date, and remaining balance — rather than just a toast.

### 7. Show Recent Payment History in Pupil Drawer
Add a "Recent Payments" section below the amount input in the payment drawer showing last 3 payments (date, amount, method) for context.

---

## Implementation Priority
1. **Order review summary** (highest conversion impact)
2. **Move upsells** (better positioning = higher AOV)
3. **Mobile-optimise confirmation** (most users are mobile)
4. **Abandoned booking capture** (requires new DB table + edge function)
5. **Referral on confirmation** (quick win, reuses existing system)
6. **Payment confirmation screen** (polish)
7. **Recent payments in drawer** (polish)

### Files to Create/Modify
- `src/components/booking/MobileBookingView.tsx` — Add review summary, reposition upsells
- `src/components/booking/OrderReviewSummary.tsx` — **New**, review card component
- `src/pages/BookingConfirmation.tsx` — Mobile-first restructure, add referral card
- `src/components/pupil-portal/PupilPaymentDrawer.tsx` — Add recent payments section
- `src/components/pupil-portal/PaymentConfirmationCard.tsx` — **New**, post-payment confirmation
- DB migration: `booking_drafts` table for abandoned booking capture
- Edge function: `save-booking-draft` for email capture

