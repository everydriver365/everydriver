

## Fix Card Tokenization Failures

### Root Cause

The `merchantIdForHPF` prop is passed as an empty string `""` everywhere. While the code falls back to `data.merchantId` from the `payment-intent-create` response, the real problem is that the Cardstream Hosted Fields SDK's `getPaymentDetails()` method returns `{ success: false }` — meaning the hosted field iframes aren't properly capturing card input or the tokenization API isn't working as expected with this SDK version.

The Hosted Fields approach has multiple fragile dependencies (jQuery, iframe rendering, SDK polling) and the `getPaymentDetails` tokenization method may not be fully supported by Cardstream's SDK in this context.

### Solution: Replace inline card entry with HPP redirect

The **HPP redirect flow** (used by `CardstreamPayButton`) already works reliably. Replace the broken Hosted Fields card entry in `CardstreamCheckout` with the same HPP redirect approach, while keeping the Apple Pay and Google Pay wallet buttons intact.

### Changes

**File: `src/components/payments/CardstreamCheckout.tsx`**
- Remove the jQuery/Hosted Fields SDK initialization (lines 173-284)
- Remove the hosted field form elements (`#cs-payment-form` with `hostedfield:*` inputs)
- Replace the "Pay with Card" button with an HPP redirect flow identical to `CardstreamPayButton` — calls `elavon-checkout` edge function, builds a hidden form, and auto-submits to Cardstream's hosted payment page
- Keep the Apple Pay and Google Pay wallet buttons as-is (they work independently)
- Remove the `merchantIdForHPF` prop since it's no longer needed for card entry (still used for Google Pay gateway merchant ID — will fall back to fetching from `payment-intent-create`)

**File: `src/components/instructor/TakePaymentModal.tsx`**
- Remove the `merchantIdForHPF=""` prop (no longer needed)
- Update the `onPaid` flow — since HPP redirects away, the success callback will be handled by the return URL redirect instead

**Files: `src/pages/PublicPaymentPage.tsx`, `src/pages/BookingSummary.tsx`, `src/components/booking/MobileBookingView.tsx`**
- Same prop cleanup for `merchantIdForHPF`

### Technical Detail

The HPP redirect approach:
1. Calls `elavon-checkout` edge function to get signed form fields + gateway URL
2. Creates a hidden HTML form with all signed fields
3. Auto-submits the form → browser redirects to Cardstream's secure hosted page
4. User enters card details on Cardstream's own page
5. Cardstream redirects back to our `payment-callback` edge function on completion

This is the same proven flow used by `CardstreamPayButton` and eliminates all jQuery/iframe/tokenization issues.

