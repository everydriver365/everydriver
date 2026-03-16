

## Fix: Defer booking creation until after successful card payment

### Problem
When a user clicks "Pay by Card" on the booking page, the system immediately calls `ensureBookingCreated()` which creates the pupil record, scheduled lessons, and upsell records in the database — all **before** the user has entered any card details or completed payment. If they cancel or the payment fails, the booking already exists as a real record.

### Root Cause
In `BookingSummary.tsx`, the handlers `handleElavonCheckout` and `handleNPICheckout` both call `ensureBookingCreated()` first, then show the card form. The same pattern exists in `MobileBookingView.tsx`.

### Solution
Reverse the order: show the card payment form first, then create the booking only after payment succeeds.

### Changes

**File: `src/pages/BookingSummary.tsx`**

1. **`handleElavonCheckout` / `handleNPICheckout`**: Remove the `ensureBookingCreated()` call. Just show the hosted fields directly (after validating form completeness).

2. **`CardstreamCheckout` `onPaid` callback** (line ~1957): Move `ensureBookingCreated()` into this callback. After booking is created, navigate to confirmation.

3. **Pass no `pupilId`** to `CardstreamCheckout` initially — the component already handles `pupilId` being undefined (falls back to empty string in URLs).

4. **After payment succeeds in `onPaid`**: Call `ensureBookingCreated()`, wait for pupilId, then navigate.

**File: `src/components/booking/MobileBookingView.tsx`**

Same pattern — the parent component that sets `embeddedCheckoutPupilId` creates the booking first. Need to defer that similarly via the `onEmbeddedCheckoutSuccess` callback.

**File: `src/components/payments/CardstreamPayButton.tsx`**

- The `returnUrl` currently embeds `pupilId` — since we won't have it yet, it will use the empty string fallback. After iframe payment succeeds via `onSuccess`, the parent handles booking creation and navigation (not the returnUrl redirect).

### Flow After Fix

```text
Before:  Click Pay → Create Booking → Show Card Form → Enter Card → Pay → Navigate
After:   Click Pay → Show Card Form → Enter Card → Pay → Create Booking → Navigate
```

### Risk Mitigation
- `ensureBookingCreated` already has idempotency protection (`bookingPupilId` check + `bookingInProgressRef`)
- The `payment-callback` edge function handles empty `pupilId` gracefully (treats as guest payment)
- If booking creation fails after payment, the user sees an error but the payment is recorded in payment_intents for reconciliation

