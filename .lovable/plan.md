
Root cause summary:

1. The “invalid signature” is not the first failure.
   - Your callback logs show Cardstream is already returning:
     - `responseCode: 66058`
     - `responseMessage: "Missing cardNumber"`
   - That means the Hosted Fields form is being submitted without the SDK attaching the card data.

2. The current submit method is the likely cause.
   - In `src/components/payments/CardstreamEmbeddedCardForm.tsx`, the form uses:
     - `formRef.current.submit()`
   - Native `form.submit()` bypasses normal submit-event handling.
   - Hosted Fields usually needs the submit event to fire so it can intercept the form, inject/tokenize card data, then post to the gateway.
   - Result: Cardstream receives the signed hidden fields, but no card number, so it returns an error payload.

3. The callback then masks that gateway error as “invalid signature”.
   - In `supabase/functions/payment-callback/index.ts`, you verify the callback signature before surfacing the real gateway response.
   - Since the callback is an error response from the failed Hosted Fields submission, your verifier is rejecting it, so the user only sees `Invalid signature` instead of the real issue.

4. Your AVS/billing-field fix is not fully wired through.
   - In `src/components/payments/CardstreamCheckout.tsx`, the call to `payment-intent-create` only sends:
     - `amount, pupilId, instructorId, customerName, customerEmail, currency`
   - It does not send `customerAddress` or `customerPostcode`.
   - So even though `payment-intent-create` can conditionally sign billing fields, the embedded checkout path is not actually providing them.

Suggested fix:

1. Fix the Hosted Fields submit flow first.
   - Update `src/components/payments/CardstreamEmbeddedCardForm.tsx`
   - Replace native submit with an event-driven submit:
     - preferred: `formRef.current.requestSubmit()`
     - fallback: trigger jQuery submit on the form if the SDK expects that
   - Goal: let the Hosted Fields plugin intercept submission and include card data.

2. Pass billing data into the signed request.
   - Update `src/components/payments/CardstreamCheckout.tsx`
   - Include `customerAddress` and `customerPostcode` in the `payment-intent-create` request body.
   - This makes the AVS fields actually reach `supabase/functions/payment-intent-create/index.ts` and become part of the signed payload when present.

3. Improve callback handling so real gateway errors are visible.
   - Keep signature verification, but don’t let it fully hide the underlying Cardstream response during debugging.
   - At minimum, log both:
     - signature validation result
     - raw `responseCode` / `responseMessage`
   - If signatures still fail after fixing submission, then narrow verification to the exact callback fields Cardstream signs rather than every echoed field.

Recommended implementation order:

1. `src/components/payments/CardstreamEmbeddedCardForm.tsx`
   - switch `submit()` to `requestSubmit()` / SDK-compatible submit trigger

2. `src/components/payments/CardstreamCheckout.tsx`
   - send `customerAddress` and `customerPostcode` to `payment-intent-create`

3. Re-test the payment flow
   - If `responseCode=66058` disappears, the main issue was the submit path
   - Then re-check whether callback signature verification still fails

Expected outcome after the fix:

- Card details are actually submitted through Hosted Fields
- Cardstream stops returning `Missing cardNumber`
- Billing/AVS fields are included when available
- If signature verification is otherwise correct, the invalid signature error should disappear as well
- If it does not, the next step is a smaller callback-signature field-normalization fix, not another checkout change
