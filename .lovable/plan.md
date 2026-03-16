
Goal: fix the Elavon card payment failure showing `[#00065539]`.

What I found:
- `65539` maps to `INVALID CREDENTIALS` in Cardstream’s response table.
- The frontend is not the main problem: `CardstreamPayButton` submits successfully to `elavon-checkout`, and the function logs show the signed HPP payload is being generated.
- The failure happens at the gateway after form submission, before our callback logic runs.
- In the current code, the Elavon HPP flow only uses `ELAVON_MERCHANT_ALIAS` + `ELAVON_SECRET_KEY`.
- `ELAVON_PROCESSOR_ID` and `ELAVON_PUBLIC_KEY` are not used by the hosted payment page flow, so updating them alone would not fix this specific error.
- The React `ref` warnings in `CardstreamCheckout` are separate and unrelated to the payment rejection.

Plan:
1. Separate Elavon credential usage by flow
   - Keep hosted card-page credentials distinct from wallet/direct credentials.
   - Update `elavon-checkout` to use only the credentials required for the hosted payment page.
   - Avoid assuming the “secret key” supplied for newer wallet/direct flows is also the correct HPP signing key.

2. Add gateway-safe diagnostics
   - Log which non-sensitive fields are being sent for HPP signing.
   - Log whether the callback is ever reached.
   - Return a clearer internal error path when the gateway rejects the request, so we can distinguish “bad HPP credentials” from “bad request shape”.

3. Align the implementation with Cardstream/Elavon credential types
   - Review all Elavon-related functions (`elavon-checkout`, `payment-intent-create`, `payment-direct-sale`, `pupil-payment-checkout`) and make the credential mapping explicit.
   - If needed, introduce dedicated HPP secret names rather than reusing wallet/direct credentials.

4. Clean up the payment UI warning
   - Inspect `BookingSummary` / `CardstreamCheckout` / `CardstreamPayButton` for a ref being passed into a plain function component.
   - Convert the affected payment component to `forwardRef` or stop passing the ref.

Technical details:
- Files likely involved:
  - `supabase/functions/elavon-checkout/index.ts`
  - `supabase/functions/payment-direct-sale/index.ts`
  - `supabase/functions/payment-intent-create/index.ts`
  - `supabase/functions/pupil-payment-checkout/index.ts`
  - `src/components/payments/CardstreamCheckout.tsx`
  - `src/components/payments/CardstreamPayButton.tsx`
- No database changes are needed.
- This is most likely a credential-type mismatch, not an iframe-vs-redirect issue.

Expected result:
- Elavon hosted card payments submit with valid credentials instead of failing at the gateway.
- If credentials are still wrong, the app will surface a more precise failure state and we’ll know exactly which credential set is mismatched.
- The unrelated React ref warning will also be removed.
