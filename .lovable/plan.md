

## Plan: Add Admin Fee to Pupil Payments

Yes, this is achievable. The platform already has a `platform_commission_config` table with an active config: **2.5% + 20p** per payment. Currently, this fee is tracked after the fact but **not added to the charge amount**. The `commission_payer` setting per instructor determines who absorbs the fee, but the actual payment amount sent to the gateway is always the base amount.

### What will change

**1. Frontend — Show fee breakdown before payment (PupilPaymentDrawer + PupilPaymentModal)**
- When the pupil selects an amount (e.g. £40), fetch the active commission config
- If `commission_payer === 'pupil'`, calculate and display the admin fee (£40 × 2.5% + £0.20 = £1.20)
- Show: "Lesson credit: £40.00 | Admin fee: £1.20 | **Total: £41.20**"
- If `commission_payer === 'instructor'`, no fee shown — instructor absorbs it
- The total (with fee) is what gets sent to the payment gateway

**2. Edge function — `pupil-payment-checkout`**
- Accept a new optional `adminFee` field in the request body
- Add `adminFee` to `amount` when calculating `amountInPence` sent to the gateway
- Store the fee breakdown in `payment_intents` metadata for audit

**3. Edge function — `payment-callback`**
- On successful payment, credit the pupil balance with only the **base amount** (not the fee)
- Record the fee portion in the `platform_commissions` table (gross, net, commission_amount)
- Payment history shows the gross amount paid, with a note indicating the fee

**4. Parent top-up (ParentPaymentTopUp)**
- Same logic: fetch commission config, show fee if pupil pays, charge total

### Data flow

```text
Pupil enters £40
  ↓
Frontend calculates fee (2.5% + 20p = £1.20)
  ↓
Gateway charges £41.20
  ↓
payment-callback receives £41.20
  ↓
Credits pupil balance: £40.00
Records platform_commissions: £1.20
Payment history: £40.00 (net to pupil)
```

### Files to modify
- `src/components/pupil-portal/PupilPaymentDrawer.tsx` — fee display + pass total to checkout
- `src/components/pupil-portal/PupilPaymentModal.tsx` — same for desktop
- `src/components/parent/ParentPaymentTopUp.tsx` — same for parent flow
- `supabase/functions/pupil-payment-checkout/index.ts` — accept adminFee, charge total
- `supabase/functions/payment-callback/index.ts` — split payment into balance credit + commission record

### New helper
- `src/hooks/useAdminFee.ts` — fetches active commission config and calculates fee for a given amount + commission_payer setting

