

## Fix "Problem Generating Payment Token" Error

### Root Cause

The form's `action` is set to `https://gateway.cardstream.com/hosted/` (the Hosted Payment Page URL). Hosted Fields are designed to work with the **Direct** integration, not the Hosted one. The SDK expects to submit tokenized data to the Direct endpoint or your own server — using the HPP URL causes the token generation to fail.

### Solution

Change the approach to **not** use `autoSubmit`. Instead:
1. Intercept form submission manually
2. On submit, the SDK's hosted field iframes have already captured card data — extract the `paymentToken` via the form's hidden fields (the SDK injects it automatically before submit)
3. POST the token + order reference to our existing `payment-direct-sale` edge function
4. Handle success/failure in-app (no redirect needed)

### Changes

**File: `src/components/payments/CardstreamCheckout.tsx`**

1. Change SDK init from `autoSubmit: true` to `autoSubmit: false` — we handle submission ourselves
2. Set form `action` to `https://gateway.cardstream.com/direct/` (the correct Direct URL, required by SDK for tokenization context)
3. Add a `onSubmit` handler on the form that:
   - Calls `event.preventDefault()`
   - Reads the `paymentToken` from the form data (SDK injects it as a hidden field after tokenization)
   - If no token, calls `hostedFormInstanceRef.current.getPaymentDetails()` to trigger tokenization, then reads the token
   - Sends `{ orderRef, method: "card_token", cardPaymentToken: token, customerName, customerEmail }` to `payment-direct-sale` edge function
   - On success: calls `onPaid()` and shows toast
   - On failure: shows error toast
4. Use the `orderRef` from the `payment-intent-create` call (already stored in state) rather than the separate ref from `elavon-checkout`, to ensure the `payment-direct-sale` function can find the payment intent

**Key technical detail**: The `elavon-checkout` call creates its own `payment_intents` row with a different `order_ref` than the `payment-intent-create` call. The `payment-direct-sale` function looks up by `order_ref`. We need to align these — use the `orderRef` from `payment-intent-create` for the card flow, and pass the signed fields from `elavon-checkout` only for the hidden form fields needed by the SDK.

Actually, simplest fix: after the SDK tokenizes and we get the `paymentToken`, we call `payment-direct-sale` with the `orderRef` from `payment-intent-create` (which already has a payment_intents row). This is the same pattern used by Apple Pay and Google Pay in this component.

### Summary of edits in `CardstreamCheckout.tsx`:
- Line ~256: Change `autoSubmit: true` → `autoSubmit: false`  
- Line ~521: Change form `action` to Direct URL, add `onSubmit` handler
- Add new `handleCardSubmit` function that extracts paymentToken and calls `payment-direct-sale`
- Remove reliance on form auto-posting to gateway

