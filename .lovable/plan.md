

# GoCardless Integration: Instant Bank Pay + Direct Debit for Pupils

## Overview

Three major pieces of work:

1. **Instant Bank Pay at checkout** -- a new payment option on the booking page using GoCardless Open Banking (one-off payment, instant confirmation, ~1% + 20p fees)
2. **Direct Debit toggle for instructors** -- a new feature toggle in instructor settings enabling Direct Debit collection from weekly recurring pupils
3. **Direct Debit mandate setup for pupils** -- when an instructor enables DD, the recurring subscription flow can set up GoCardless mandates for pupils

---

## 1. Database Changes

- Add `instant_bank_pay_enabled` boolean column to `instructors` table (default false) -- controls whether Instant Bank Pay shows at checkout
- Add `direct_debit_enabled` boolean column to `instructors` table (default false) -- controls whether DD is offered for recurring pupil subscriptions
- Add `gocardless_mandate_id` column to `pupil_subscriptions` table -- tracks pupil DD mandate per subscription
- Add `gocardless_customer_id` column to `pupil_subscriptions` table -- tracks pupil GoCardless customer
- Add `gocardless_payment_id` column to `payment_intents` table -- links one-off bank payments

## 2. Instructor Settings Toggle

Add two new entries to `FeatureTogglesSettings.tsx`:
- **"Instant Bank Pay"** -- "Offer one-off bank payments at checkout (lower fees than card)"
- **"Direct Debit for Pupils"** -- "Collect weekly lesson payments via Direct Debit from recurring pupils"

Both use the existing toggle pattern writing to the `instructors` table.

## 3. Instant Bank Pay -- Checkout Tile

In `MobileBookingView.tsx`, add a new payment tile after the Cash option:
- Branded tile with a bank icon and "Pay by Bank" label
- Shows the full amount, "Instant confirmation" badge
- Only visible when instructor has `instant_bank_pay_enabled` and gateway health reports GoCardless available

### Flow:
1. Pupil clicks "Pay by Bank"
2. Frontend calls `create-booking` (silent) to get a booking/pupil ID
3. Frontend invokes new **`gocardless-instant-bank-pay`** edge function with amount, pupil ID, booking ID, redirect URL
4. Edge function creates a GoCardless Billing Request with `payment_request` (one-off) using `scheme: "faster_payments"` + Instant Bank Pay flow
5. Returns `authorisation_url` -- pupil is redirected to their bank
6. On return, `BookingSummary.tsx` checks URL params for success, then calls `confirm-booking`
7. **`gocardless-webhook`** receives payment confirmation and calls `increment_pupil_balance` + records in `payment_intents`

### New Edge Function: `gocardless-instant-bank-pay`
- Creates billing request with `payment_request` only (no mandate)
- Creates billing request flow with redirect
- Records payment intent in DB
- Uses existing `GOCARDLESS_ACCESS_TOKEN` and `GOCARDLESS_ENVIRONMENT` secrets

## 4. Direct Debit for Recurring Pupils

### Instructor-side:
- When instructor creates a recurring subscription via `AddSubscriptionSheet` and selects "GoCardless (Direct Debit)":
  - After saving, invoke **`gocardless-pupil-mandate`** edge function
  - This creates a GoCardless customer for the pupil and a billing request for mandate setup
  - Returns an `authorisation_url` that the instructor can share with the pupil (via SMS/link)
  - Store `gocardless_mandate_id` on `pupil_subscriptions` once mandate is fulfilled

### Webhook handling:
- Extend `gocardless-webhook` to handle pupil mandate fulfillment (update `pupil_subscriptions`)
- Extend `process-recurring-subscriptions` to create GoCardless payments for DD subscriptions instead of just scheduling lessons

### New Edge Function: `gocardless-pupil-mandate`
- Creates GoCardless customer for the pupil
- Creates billing request with mandate_request (BACS)
- Returns authorisation URL for the pupil to complete

## 5. Payment Health Check

Update `payment-health` edge function to include GoCardless status check (ping API with access token).

## 6. Webhook Updates

Extend `gocardless-webhook/index.ts`:
- Handle pupil mandate events (update `pupil_subscriptions.gocardless_mandate_id`)
- Handle one-off Instant Bank Pay payment confirmations (call `increment_pupil_balance`, trigger `confirm-booking`)

## 7. BookingSummary.tsx Changes

- Fetch instructor's `instant_bank_pay_enabled` flag alongside existing data
- Add `handleInstantBankPay` handler (similar pattern to Clearpay/Klarna)
- Handle redirect-back URL params for GoCardless success/cancelled
- Pass new props to `MobileBookingView`

## Summary of Files

| File | Change |
|------|--------|
| Migration SQL | Add columns to `instructors`, `pupil_subscriptions`, `payment_intents` |
| `FeatureTogglesSettings.tsx` | Add 2 toggle entries |
| `MobileBookingView.tsx` | Add Instant Bank Pay tile + props |
| `BookingSummary.tsx` | Add handler, fetch flag, handle redirect |
| `supabase/functions/gocardless-instant-bank-pay/index.ts` | New -- one-off bank payment |
| `supabase/functions/gocardless-pupil-mandate/index.ts` | New -- pupil DD mandate setup |
| `supabase/functions/gocardless-webhook/index.ts` | Extend for pupil mandates + instant pay |
| `supabase/functions/payment-health/index.ts` | Add GoCardless check |
| `supabase/functions/process-recurring-subscriptions/index.ts` | Create DD payments for GoCardless subs |
| `AddSubscriptionSheet.tsx` | Trigger mandate setup when GoCardless selected |

