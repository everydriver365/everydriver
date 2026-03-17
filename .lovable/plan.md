

# Payment Splitting Between Business and Instructor

## Current State

Your platform **already has a commission system** that deducts a platform fee (2.5% + 20p) from digital payments. Here's what's in place:

- **`platform_commission_config` table** — stores the commission rate and fixed fee, editable by admins via the Commission Settings Manager.
- **`platform_commissions` table** — records every commission deducted, with gross amount, net amount, and fee breakdown.
- **`commission_payer` setting** — each instructor chooses whether the pupil or the instructor absorbs the fee.
- **Payment callback logic** — when a card/wallet payment completes, the system splits the amount: the base goes to the pupil's balance, and the fee is recorded as platform revenue.

However, **actual fund movement** (sending money to the instructor's bank account) is not yet implemented. The memory references a Telleroo integration for automated payouts, but no edge function code exists for it yet.

## What "Splitting Payments" Can Mean

There are two approaches with Square:

### Option A: Post-Payment Split (Current Architecture)
1. The full payment goes to **your Square account**.
2. The platform fee is recorded in `platform_commissions`.
3. The net amount is paid out to instructors separately (via bank transfer / Telleroo / manual).

This is what's partially built — the recording works, but the automated payout to instructors isn't wired up yet.

### Option B: Square Split Payments (OAuth Marketplace)
Square supports splitting payments at the point of sale using their **OAuth marketplace model**. Each instructor would connect their own Square account, and payments would be split automatically — your platform takes its fee, and the instructor receives their share directly from Square.

**This requires**: Square OAuth onboarding for each instructor, which is a significant integration effort and requires Square approval as a marketplace/platform.

## Recommended Plan

Implement **Option A** — automated payouts to instructors after payments are received. This works with your existing single Square account and commission system.

### Steps

1. **Create `instructor_payouts` table** — track each payout with status, amount, bank details reference, and idempotency key.

2. **Build `auto-payout-instructor` edge function** — triggered after a successful payment, it:
   - Looks up the instructor's bank details from `instructor_bank_details`
   - Calculates net amount (gross minus platform commission)
   - Calls Telleroo API (or alternative bank transfer service) to send funds
   - Records the payout in `instructor_payouts`

3. **Add payout dashboard for instructors** — show pending/completed payouts with amounts and dates.

4. **Add admin payout overview** — view all payouts, retry failed ones, and see commission revenue vs payouts.

### Prerequisites
- Instructors need bank details stored (sort code + account number) — check if `instructor_bank_details` table exists
- A payout provider API key (Telleroo is referenced in memory but not yet configured)

### Alternative: Manual Payouts
If you prefer to start simpler, the commission recording already works. You could just add a **payout tracking UI** where admins manually mark payouts as sent, without automating the bank transfer.

