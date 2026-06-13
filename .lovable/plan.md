# Full Square Removal + Ryft Cutover

No payments have been processed yet (Ryft: 0 intents, Square: production traffic in code but no live revenue you want to preserve), so we can do a clean cutover rather than a parallel-run migration.

## Current state

- **Square surface:** 10 edge functions, ~248 code files touch the word "square" (many are unrelated string matches; the real wiring is ~30 components/pages + edge functions + 2 DB tables).
- **Ryft surface today:** 4 edge functions (`ryft-create-checkout`, `ryft-webhook`, `ryft-onboard-instructor`, `ryft-account-status`), 2 DB tables (`ryft_payment_intents`, `ryft_webhook_events`), secrets present (`RYFT_SECRET_KEY`, `RYFT_PUBLIC_KEY`, `RYFT_WEBHOOK_SECRET`, `RYFT_ENVIRONMENT`).
- **Gap:** Ryft only covers one-off checkout. Square currently also handles: invoices, subscriptions, wallet/Apple-Google Pay, refunds, OAuth onboarding, webhooks, instructor split payouts.

## What we remove

**Edge functions (delete + undeploy):**
`square-booking-wallet-payment`, `square-checkout`, `square-create-subscription`, `square-invoice-manage`, `square-oauth`, `square-payment`, `square-refund`, `square-wallet-config`, `square-wallet-payment`, `square-webhook`.

**Frontend pages/components:**
- `src/pages/invoices/SquareInvoicesPage.tsx`
- `src/pages/instructor/SquareCallback.tsx`
- `src/pages/instructor/InstructorSquareInvoices.tsx`
- `src/pages/admin/AdminSquareInvoices.tsx`
- All `square*` references inside `InstructorIntegrationsHub`, `InstructorPaymentsDesktop`, `InstructorPlanBilling`, `AdminInstructorPayouts`, booking checkout, invoice PDF generator, payment-health/audit pages.

**Routes:** Square invoice/callback routes in `instructorPortalRoutes.tsx` and `adminRoutes.tsx`.

**DB:** Drop `square_invoices` and `processed_square_events` (no live data to preserve — confirm before drop).

**Secrets:** Remove `SQUARE_*` secrets at the end once nothing references them.

**Memory:** Update `mem://features/payments/instructor-payout-architecture` and `mem://features/payments/sumup-integration-logic` to remove Square references. Add `mem://constraints/payment-gateway-ryft-only`.

## What we build on Ryft

Ryft already has Standard Accounts (onboarding), Payment Sessions (checkout), Split Payments, Subscriptions, Refunds, Webhooks, and Apple/Google Pay via Drop-in. Mapping:

| Capability | Old (Square) | New (Ryft) |
|---|---|---|
| Instructor onboarding | `square-oauth` | `ryft-onboard-instructor` (exists; verify Standard Account flow) |
| One-off lesson/course checkout | `square-checkout` / `square-payment` | `ryft-create-checkout` (exists; extend with split + service-fee logic) |
| Wallet (Apple/Google Pay) | `square-wallet-payment` | Ryft Drop-in (built into payment session — no separate function) |
| Invoices | `square-invoice-manage` | New `ryft-invoice-manage` — Ryft Payment Links + a `ryft_invoices` table mirroring needed columns |
| Subscriptions (instructor billing) | `square-create-subscription` | New `ryft-create-subscription` using Ryft Subscriptions API |
| Refunds | `square-refund` | New `ryft-refund` |
| Webhook | `square-webhook` | `ryft-webhook` (exists; extend event coverage: payment.captured, payment.refunded, subscription.*, payout.*) |
| Split payout to instructor | Square multi-party | Ryft `splits[]` on payment session — keep tiered service-fee logic (2.0%+25p / 1.5%+25p) and 0–100% pupil/instructor split |

## Phased delivery

```text
Phase 1  DB + edge functions
  - migration: create ryft_invoices, ryft_subscriptions; drop square_* tables
  - new edge functions: ryft-invoice-manage, ryft-create-subscription, ryft-refund
  - extend ryft-create-checkout (splits, service fee) and ryft-webhook (full event set)

Phase 2  Frontend cutover
  - rename + rewire: InstructorSquareInvoices -> InstructorInvoices (Ryft)
                    AdminSquareInvoices -> AdminInvoices
                    SquareCallback -> RyftCallback (or remove if hosted onboarding)
  - update IntegrationsHub, PaymentsDesktop, PlanBilling, BookingConfirmation, AdminInstructorPayouts
  - update invoice PDF generator to read ryft_invoices
  - update routes

Phase 3  Cleanup
  - delete all square-* edge functions (undeploy)
  - delete unused Square pages/components
  - rm SQUARE_* secrets
  - update memory files
  - run security + linter scans
```

## Open questions before I start

1. **Drop or keep `square_invoices` / `processed_square_events`?** You said no payments taken — safe to drop. Confirm.
2. **Instructor onboarding model.** Ryft Standard Accounts (instructor signs Ryft TOS, fastest) vs Ryft Sub-Accounts (you remain MOR, more KYC on you). Square used OAuth ≈ Standard. Default: Standard.
3. **Invoices.** Do you want true Ryft hosted invoices (Payment Links + email) or to keep your existing PDF + a Ryft pay link embedded? Default: keep your PDF, embed Ryft pay link (matches current UX).
4. **Subscriptions.** Are instructor 365 subscriptions currently on Square or GoCardless? If GoCardless (per `mem://features/subscription/billing-lifecycle`), we may not need `ryft-create-subscription` at all — confirm.

Answer those four and I'll execute Phase 1 immediately on switch to build mode.
