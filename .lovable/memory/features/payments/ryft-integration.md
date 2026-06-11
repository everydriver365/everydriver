---
name: Ryft card processor integration
description: Ryft is the platform-wide card processor (replaces Square for new payments). Hosted checkout, sub-account split payouts, Apple/Google Pay, 3DS.
type: feature
---

## Overview
Ryft (https://developer.ryftpay.com) is the primary card processor across Everydriver. Square code remains in the repo for historical payment visibility only — all NEW card flows must route through Ryft.

## Secrets
- `RYFT_SECRET_KEY` — server-side, sent in `Authorization` header (raw, not Bearer)
- `RYFT_PUBLIC_KEY` — publishable, frontend-safe
- `RYFT_WEBHOOK_SECRET` — HMAC-SHA256 signing for webhook verification (header `RyftSignature`)
- `RYFT_ENVIRONMENT` — MUST be literal `production` for live (matches `GOCARDLESS_ENVIRONMENT`/`SQUARE_ENVIRONMENT` rule)

## Edge functions
- `ryft-create-checkout` — creates a Ryft PaymentSession, inserts `ryft_payment_intents` row, returns `checkoutUrl`. Requires `instructorId`; refuses if instructor has no `ryft_account_id` or `ryft_payouts_enabled=false` (no fallback, per LIVE DATA ONLY rule).
- `ryft-webhook` — verifies HMAC, dedupes via `ryft_webhook_events`, on `PaymentSession.approved` credits pupil balance via `increment_pupil_balance` RPC and writes `payment_history` (method = `ryft_card`).
- `ryft-onboard-instructor` — creates sub-account + hosted onboarding link.
- `ryft-account-status` — refreshes `ryft_account_status` + `ryft_payouts_enabled` from Ryft.

## Tables
- `instructors.ryft_account_id`, `ryft_account_status`, `ryft_onboarding_url`, `ryft_payouts_enabled` (boolean default false)
- `ryft_payment_intents` — one row per session, amount_pence/service_fee_pence/platform_fee_pence/status
- `ryft_webhook_events` — dedup by `event_id`

## Splits
Every PaymentSession is created with `splits[]` directing `amount - (serviceFeePence + platformFeePence)` to the instructor sub-account. Platform retains the Service Fee (UK label — never "surcharge") + £1 platform fee.

## Fees
Use existing `mem://features/payments/tiered-service-fee-structure` and `mem://features/payments/service-fee-split-logic` to compute `serviceFeePence`. Platform fee from `PLATFORM_FEE_GBP`.

## Apple Pay
Hosted checkout handles Apple Pay/Google Pay/3DS automatically once enabled in the Ryft dashboard. Apple Pay also requires the domain association file at `/.well-known/apple-developer-merchantid-domain-association` (user supplies the file content from Ryft).
