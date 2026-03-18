

# Fix: Booking Flow "Pay Now" Button Not Working on Mobile

## Problem
On mobile, the sticky bottom bar shows a "Pay £X" button. When tapped, it only scrolls to the payment section via `scrollToPayment()`. Two issues:

1. **The scroll-only behavior feels broken** — users expect tapping "Pay" to trigger payment, but it just scrolls down to reveal the payment options (card, Clearpay, Klarna). If the payment section is already partially visible, it looks like nothing happened.

2. **Wallet buttons missing `ensureBookingCreated`** — The `SquareWalletButtons` in `MobileBookingView.tsx` (line 877) doesn't pass `ensureBookingCreated`, so Apple/Google Pay would process payment without first creating the booking record.

## Plan

### 1. Fix the bottom bar button behavior
When `canSubmit` is true and the button says "Pay £X", clicking it should:
- If the card form isn't visible yet, trigger `handleElavonCheckout` (which shows the embedded Square card form) AND scroll to payment
- This makes the "Pay" button actually initiate the primary payment flow instead of just scrolling

**File:** `src/pages/BookingSummary.tsx`
- Create a new handler `handleMobilePayClick` that calls `handleElavonCheckout()` then scrolls to payment
- Pass this as `onPayClick` to `MobileBookingView` instead of a plain scroll function

**File:** `src/components/booking/MobileBookingView.tsx`
- Update `scrollToPayment` to also trigger `onNPICheckout` when `canSubmit` is true

### 2. Pass `ensureBookingCreated` to wallet buttons on mobile
**File:** `src/components/booking/MobileBookingView.tsx` (line 877-885)
- Add `ensureBookingCreated` prop to `SquareWalletButtons` so Apple/Google Pay creates the booking before processing payment

### 3. Pass `ensureBookingCreated` through MobileBookingView props
**File:** `src/components/booking/MobileBookingView.tsx`
- Add `ensureBookingCreated` to the `MobileBookingViewProps` interface
- Wire it through to `SquareWalletButtons`

**File:** `src/pages/BookingSummary.tsx`
- Pass `ensureBookingCreated` down to `MobileBookingView`

### Summary of changes
- 2 files modified: `BookingSummary.tsx`, `MobileBookingView.tsx`
- The "Pay £X" bottom bar button will now show the card form and scroll to it
- Apple/Google Pay will properly create the booking before charging

