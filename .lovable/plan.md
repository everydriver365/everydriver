

# Fix: Show Card Form by Default & Default to Deposit

## Problem
1. The Square card entry form only appears after clicking "Pay Card" button — users see a button instead of the card fields.
2. The default payment option is "full" instead of "deposit".

## Changes

### 1. Default `paymentOption` to `'deposit'` (BookingSummary.tsx)
**Line 166**: Change `useState<'full' | 'deposit'>('full')` → `useState<'full' | 'deposit'>('deposit')`

### 2. Auto-show card form when payment section becomes available (BookingSummary.tsx)
Add a `useEffect` that sets `showHostedFields(true)` when `canSubmit` becomes true — so the Square card fields render immediately without requiring a button click.

### 3. Remove the "Pay Card" button in MobileBookingView (MobileBookingView.tsx)
In the payment section (~line 931-961), always show `SquarePaymentForm` when `canSubmit` is true, instead of conditionally showing either the form or a "Pay Card" button. The button becomes redundant since the card form auto-appears.

### Files Modified
- `src/pages/BookingSummary.tsx` — default to deposit, auto-show card form
- `src/components/booking/MobileBookingView.tsx` — always render card form when ready

