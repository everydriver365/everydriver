
Issue found:
- The bank payment failure is not caused by the checkout UI.
- `src/pages/BookingSummary.tsx` calls the `gocardless-instant-bank-pay` backend function and shows the generic message “Failed to start bank payment” when that call fails.
- In `supabase/functions/gocardless-instant-bank-pay/index.ts`, the function picks the API base URL from `GOCARDLESS_ENVIRONMENT`, defaulting to `sandbox`.
- The backend logs show the exact GoCardless error: “The access token you've used is not a valid sandbox API access token” (401).

Root cause:
- The project currently has both secrets present: `GOCARDLESS_ACCESS_TOKEN` and `GOCARDLESS_ENVIRONMENT`.
- The function is calling the sandbox GoCardless API, but the stored token is a live token.
- The same environment pattern is also used in:
  - `supabase/functions/gocardless-pupil-mandate/index.ts`
  - `supabase/functions/gocardless-create-billing-request/index.ts`
So this mismatch can affect other GoCardless flows too.

Plan:
1. Update backend payment configuration so the GoCardless environment matches the token type:
   - If this project should take real payments: set `GOCARDLESS_ENVIRONMENT` to `live`.
   - If this project is only for testing: keep `sandbox` and replace `GOCARDLESS_ACCESS_TOKEN` with a sandbox token.
2. Re-test the instant bank payment flow after the secret change.
3. Optionally harden the app afterward by improving the frontend/backend error messaging so future token/environment mismatches are easier to diagnose.

Recommended path:
- Based on the error, the fastest likely fix is to switch `GOCARDLESS_ENVIRONMENT` from `sandbox` to `live`.

Technical notes:
- No database change is needed.
- No application code change is required to resolve the current failure.
- Once fixed, all GoCardless functions that share this secret setup should start using the correct API endpoint.
