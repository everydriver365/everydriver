

## Fix: Only confirm booking after payment succeeds

### Problem
The `ensureBookingCreated()` function in `BookingSummary.tsx` creates the pupil record and lessons **before** any payment is processed, and immediately shows `toast.success("Booking confirmed!")` (line 360). This gives the user a "confirmed" message even though payment hasn't happened yet. Every payment handler (NPI, Square, Klarna, Clearpay, Elavon) calls `ensureBookingCreated()` first, then redirects to the payment gateway.

Additionally, the `handleBookingSubmit` function (line 364) calls `ensureBookingCreated()` and navigates straight to `/booking-confirmation` with no payment at all.

### Solution

Two changes across two files:

#### 1. `src/pages/BookingSummary.tsx`
- **Remove the premature toast** on line 360: Change `toast.success("Booking confirmed! ...")` to `toast.info("Booking created — redirecting to payment...")` or remove it entirely since payment gateways already show their own redirect toasts.
- **Remove or guard `handleBookingSubmit`**: This function bypasses payment entirely. Either remove the direct "Book Now" path or make it only available when payment is £0 (e.g. free courses or fully credited). If payment is required, the only paths should be through payment gateways.

#### 2. `supabase/functions/create-booking/index.ts`
- **Set lessons to `payment_status: "pending"`** (already done, line 119 — this is correct).
- **Add a `booking_status` field** to the pupil record: set it to `"pending_payment"` instead of implying it's confirmed. The confirmation page and payment callbacks will update this to `"confirmed"` after payment succeeds.

Actually, looking more closely, the pupil record doesn't have an explicit `booking_status` field — the "confirmed" impression comes purely from the toast and the immediate redirect to `/booking-confirmation`. So the fix is simpler:

#### Changes — `src/pages/BookingSummary.tsx`

| Line | Current | Change to |
|------|---------|-----------|
| 360 | `toast.success("Booking confirmed! ${data.lessonsCreated} lessons scheduled.")` | `toast.info("Booking created — completing payment...")` (neutral message, no "confirmed") |
| 364-378 | `handleBookingSubmit` navigates to `/booking-confirmation` with no payment | Guard this: only allow if `totalPrice + upsellTotal === 0`. Otherwise remove the direct booking path — users must go through a payment gateway. |

#### Changes — `src/pages/BookingConfirmation.tsx`

| Area | Change |
|------|--------|
| Payment status logic (lines 66-74) | Tighten the `paymentSuccessful` check: currently `responseCode === null` (no payment params at all) counts as success. Change this so that if no payment parameters are present AND the pupil has a negative balance, show a "Payment Pending" state instead of "Booking Confirmed". |

This ensures the confirmation page only shows the green checkmark when a real payment signal is present.

### Summary
- Change the premature "Booking confirmed!" toast to a neutral "Booking created" message
- Guard the no-payment booking path so it only works for £0 courses
- Update the confirmation page to distinguish between "paid" and "pending payment" states

