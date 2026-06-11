
# Integrate Ryft (replace Square)

You've confirmed overriding the "no Stripe-style processors" rule. Ryft will become the platform-wide card processor with hosted checkout, sub-account split payouts, and Apple/Google Pay + 3DS.

## 1. Pre-flight — secrets & accounts you'll need

Before any code, you (or I via `add_secret`) will need:
- `RYFT_SECRET_KEY` (live)
- `RYFT_SECRET_KEY_SANDBOX` (for the staging env)
- `RYFT_PUBLIC_KEY` (publishable, safe in frontend)
- `RYFT_WEBHOOK_SECRET` (HMAC signing secret)
- `RYFT_ENVIRONMENT` = `production` (per project rule)
- Ryft Platform / "Standard" account with sub-accounts enabled (for split payouts to instructors)

Apple Pay also needs a domain verification file hosted at `/.well-known/apple-developer-merchantid-domain-association` — I'll add a placeholder route the user can replace with Ryft's file.

## 2. Database changes (one migration)

New columns on `instructors`:
- `ryft_account_id` (text) — sub-account ID
- `ryft_account_status` (text) — `pending` / `verified` / `restricted`
- `ryft_onboarding_url` (text, nullable, short-lived)
- `ryft_payouts_enabled` (boolean, default false)

New table `ryft_payment_intents` (mirrors existing `payment_intents` pattern):
- `id`, `ryft_payment_session_id`, `instructor_id`, `pupil_id`, `amount_pence`, `service_fee_pence`, `status`, `payment_method`, `last_error`, timestamps
- RLS: instructors see their own; service_role full access; admin via `has_role`
- GRANT block included

New table `ryft_webhook_events`:
- `id`, `event_id` (unique), `event_type`, `payload jsonb`, `processed_at`, `signature_valid`
- Used for idempotency, mirrors `processed_square_events`

Add `ryft` to gateway-mode enums / health checks alongside Square.

## 3. Edge functions (new)

All deploy with `RYFT_ENVIRONMENT` enforced to `production` (live keys) per the edge-function-runtime rule. Sandbox is a separate keyset only used during dev.

| Function | Purpose |
|---|---|
| `ryft-create-checkout` | Creates a Ryft PaymentSession (hosted checkout). Computes Service Fee (UK label, never "surcharge") via existing tiered logic, applies platform fee, returns `checkoutUrl`. Replaces `square-checkout` callers. |
| `ryft-webhook` | Verifies HMAC, dedupes via `ryft_webhook_events`, on `PaymentSession.approved` calls `increment_pupil_balance` RPC and writes `payment_history`. Mirrors `square-webhook`. |
| `ryft-onboard-instructor` | Creates Ryft sub-account for an instructor, returns hosted onboarding link, stores `ryft_account_id`. |
| `ryft-account-status` | Polls / refreshes onboarding & payouts status (cron + manual). |
| `ryft-health` | Reports `{configured, available}` — wired into `usePaymentGatewayHealth`. |
| `public-start-payment` | Add `ryft` to allowed methods list (alongside square/klarna/clearpay). |

Split-payout model: every PaymentSession is created with `splits` referencing the instructor's `ryft_account_id` for the instructor share, and the platform retains the Service Fee + platform fee. No manual reconciliation needed (unlike SumUp).

## 4. Frontend changes

- `src/lib/getActivePaymentQrUrl.ts` — keep, but the link now points to a `/pay/ryft/:sessionId` route that invokes `ryft-create-checkout` and redirects to Ryft's hosted page.
- `TakePaymentModal`, `PupilPaymentModal`, `PupilPortalPayments` — swap Square primary card tile to Ryft (logo, copy). Apple Pay / Google Pay / 3DS are handled inside Ryft hosted checkout, no extra UI.
- `SchoolPaymentGatewaysSection` — replace Square logo/row with Ryft; keep mode toggle. (Stripe/PayPal "own gateway" rows untouched per scope.)
- `usePaymentGatewayHealth` — add `ryft` to the status map; remove `square` field once cutover confirmed (kept temporarily as readonly for legacy history).
- Add `src/assets/ryft-logo.svg` (placeholder; user can swap real asset).
- Instructor "Connect payouts" screen: new card under settings that calls `ryft-onboard-instructor` and shows verification state.

## 5. Cutover strategy for existing Square data

- Leave `square-*` functions and `square_invoices` table in place (read-only) so historical payments remain visible.
- New payments route exclusively through Ryft.
- Instructors with `ryft_payouts_enabled=false` see a banner blocking new card payments until onboarding finishes (per "no fallbacks" rule — no silent re-routing).

## 6. Memory + constraints updates

After build:
- Remove `Stripe` & implicit "Ryft forbidden" from `Forbidden` core rule; add note: "Ryft is the card processor; Square retained read-only for legacy."
- New memory file `mem://features/payments/ryft-integration` documenting sub-account model, webhook signing, Service Fee labelling, environment lock.
- Update `mem://constraints/legacy-payment-gateways-removed` to add Square to the retired-but-readable list.

## 7. Out of scope (call out explicitly)

- No Ryft Drop-in / Elements (hosted checkout only, per your selection).
- No mobile-layout changes (per mobile-update-policy).
- GoCardless, Klarna, Clearpay, SumUp untouched.
- No data migration of historical Square payments into `ryft_*` tables.

## Technical notes

- Ryft API base: `https://api.ryftpay.com/v1` (live) / `https://sandbox-api.ryftpay.com/v1`.
- Auth: `Authorization: <secret_key>` header (not Bearer).
- Webhook signature: `RyftSignature` header, HMAC-SHA256 over raw body, compare with `RYFT_WEBHOOK_SECRET`.
- PaymentSession amounts in minor units (pence) — matches existing pence-based code paths.
- Sub-account routing: `accountId` header on create-session, or `splits[]` for platform-retained fees.
- 3DS / Apple Pay / Google Pay are automatic on hosted checkout once enabled in the Ryft dashboard — no extra integration work beyond the Apple Pay domain file.

Approve to switch to build mode and I'll start with the migration + secrets request, then the edge functions, then the UI swap.
