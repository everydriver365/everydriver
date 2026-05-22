## Problem

When generating a Square payment QR (and payment links), the edge function returns "Your Square account isn't connected" even though Square is connected in Settings.

Root cause: the instructor's Square OAuth access token expired on 25 Apr 2026 (today is 22 May 2026). Square access tokens only live ~30 days. The `square-checkout` edge function reads `square_access_token_encrypted` directly and calls Square — Square returns `UNAUTHORIZED` / `ACCESS_TOKEN_EXPIRED`, which the function maps to the friendly "Square account isn't connected" message.

There is currently **no refresh path anywhere** — `square-oauth` only has `authorize`, `callback`, and `disconnect` actions. So every instructor silently loses Square access ~30 days after connecting.

## Fix (backend only — no UI changes)

### 1. Add `refresh` action to `supabase/functions/square-oauth/index.ts`

New case `"refresh"` that:
- Accepts `{ instructor_id }`.
- Loads `square_refresh_token_encrypted`, `square_merchant_id` for that instructor (service role).
- Calls Square's `POST /oauth2/token` with `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token`.
- On success, updates `instructors` row: `square_access_token_encrypted`, `square_refresh_token_encrypted` (Square may rotate it), `square_token_expires_at`.
- On failure (e.g. revoked), clears the three fields + `square_merchant_id` and returns `{ refreshed: false, revoked: true }`.
- Uses the same `SQUARE_ENVIRONMENT` literal (`production`) check already used elsewhere — never relax that.

### 2. Make `supabase/functions/square-checkout/index.ts` refresh on demand

In the existing `if (body.instructorId)` block (around line 91):
- Also select `square_refresh_token_encrypted, square_token_expires_at`.
- If `square_token_expires_at` is missing or within 5 minutes of `now`, attempt an inline refresh (same logic as the new action, factored into a small helper at the top of the file). Use the refreshed access token + persist it.
- Keep `effectiveAccessToken = instructor.square_access_token_encrypted` as the fallback path.

Also add a **single retry on UNAUTHORIZED**: if the Square checkout call returns `UNAUTHORIZED` / `ACCESS_TOKEN_EXPIRED` / `ACCESS_TOKEN_REVOKED` and we have a `refresh_token`, run the refresh helper once and replay the checkout request before mapping to the friendly error.

### 3. Out of scope (intentionally)

- No changes to `TakePaymentModal.tsx` or any other frontend.
- No changes to the friendly error mapping — it stays as the final fallback when refresh itself fails (token revoked, Square down, etc.). In that case the user does need to reconnect.
- No new pg_cron job for proactive refresh — on-demand refresh is enough and matches how other gateways here behave. Can be added later if we see repeated expiry pain.

### Files touched

- `supabase/functions/square-oauth/index.ts` — add `refresh` case.
- `supabase/functions/square-checkout/index.ts` — pre-check expiry, retry once on auth error.

### Verification

- Confirm Ken D's instructor row (`square_token_expires_at` was 2026-04-25) refreshes on next QR generation and `square_token_expires_at` moves forward ~30 days.
- Confirm a deliberately revoked instructor still gets the existing "Reconnect Square in Settings → Payments" message.
