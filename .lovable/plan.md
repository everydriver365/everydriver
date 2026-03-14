
Goal: fix the remaining card error on `/instructor/take-payment` so card submit reaches the backend sale call.

What I found:
- The card SDK is loading and fields are interactive (session replay confirms iframe fields validate and submit is clicked).
- The failure happens in the frontend before any direct-sale request:  
  `TypeError: Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'`.
- So this is not a secrets/config issue; it is a submit-handler bug in `src/components/payments/CardstreamCheckout.tsx`.

Root cause:
- In `handleCardSubmit`, `new FormData(e.currentTarget)` runs **after** `await instance.getPaymentDetails()`.
- After `await`, the React submit event object can no longer reliably provide `currentTarget` as a form element, causing the TypeError.

Implementation plan:
1. Update `handleCardSubmit` in `CardstreamCheckout.tsx`:
   - Capture form element synchronously at the top:
     - `const formEl = e.currentTarget as HTMLFormElement;`
   - Use `formEl` later (never use `e.currentTarget` after awaits).
2. Harden token extraction:
   - First read token from `getPaymentDetails()` return payload (if provided by SDK).
   - Fallback to `new FormData(formEl).get("paymentToken")`.
   - Add secondary fallback key check (e.g. lowercase variant) to avoid naming mismatches.
3. Add defensive guards:
   - If form element is missing, show a clear toast and stop.
   - Keep current paying-state lock to prevent duplicate submit clicks.
4. Keep existing direct-sale flow unchanged:
   - Continue sending `{ orderRef, method: "card_token", cardPaymentToken, ... }` to `payment-direct-sale`.
   - No database migration or backend schema changes needed.

Verification checklist after patch:
- Fill card number/expiry/CVV and click Pay once.
- Confirm no FormData TypeError in console.
- Confirm a network call to `payment-direct-sale` occurs.
- Confirm success path triggers “Payment successful” and `onPaid()` callback.
- Confirm invalid card details still show a user-friendly failure without crashing.
