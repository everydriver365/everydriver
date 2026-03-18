
Issue found:
- GoCardless is failing in the backend, not in the checkout page.
- `src/pages/BookingSummary.tsx` calls `gocardless-instant-bank-pay` and only shows a generic “Failed to start bank payment” toast when the function fails.
- The backend logs still show:
  `The access token you've used is not a valid sandbox API access token`

What this means:
- The running GoCardless function is still calling the sandbox API endpoint.
- But the stored access token is not a sandbox token, so GoCardless rejects it with 401.

Why this is happening:
- The current code already does the right case-insensitive environment handling:
  - `gocardless-instant-bank-pay`
  - `gocardless-pupil-mandate`
  - `gocardless-create-billing-request`
  - `gocardless-webhook`
  - `process-recurring-subscriptions`
- Since the logs still say “sandbox API access token”, the problem is no longer the frontend and likely not the environment-comparison code either.
- The likely remaining cause is runtime configuration:
  1. `GOCARDLESS_ENVIRONMENT` is still effectively `sandbox` or blank at runtime, or
  2. the project is using a live token while still configured for sandbox, or
  3. the secret update did not propagate to the runtime actually serving this function.

Plan:
1. Verify the active runtime configuration for GoCardless:
   - confirm whether this project should use live payments or sandbox testing
   - confirm `GOCARDLESS_ENVIRONMENT` is actually set to `live`/`production` in runtime, not just previously updated in intent
2. Standardize the secrets so they match:
   - Live payments: live token + `GOCARDLESS_ENVIRONMENT=production` (or `live`)
   - Testing only: sandbox token + `GOCARDLESS_ENVIRONMENT=sandbox`
3. Re-check all GoCardless flows because they share the same environment logic:
   - instant bank pay
   - pupil mandate setup
   - instructor billing request creation
   - recurring subscription processing
4. Harden diagnostics in code after config is fixed:
   - log which environment/base URL is selected without exposing secrets
   - return a clearer backend error for token/environment mismatch
   - improve the frontend toast so it distinguishes “payment provider misconfigured” from a generic payment failure

Technical notes:
- Evidence in code:
  - `supabase/functions/gocardless-instant-bank-pay/index.ts` chooses live only when env is `live`, `production`, or `prod`
  - same pattern exists in the other GoCardless functions
- Evidence in logs:
  - `gocardless-instant-bank-pay` is still getting a sandbox-token error right now
- Conclusion:
  - GoCardless does not work because the active backend environment and the GoCardless token still do not match
- No database change is needed for the actual fix.
- The immediate fix is configuration/runtime verification first; code changes are optional hardening afterward.
