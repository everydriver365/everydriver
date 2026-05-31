## Diagnosis

For the current instructor (`1b49d152…`) this month, the input data is:

| amount | method | status (after fix) |
|---|---|---|
| +£38 | Square | paid |
| +£38 | Cash | paid |
| −£38 | Cash | refunded |

And `platform_fees` for the month: **0 rows**.

The current fee calc (`useInstructorPaymentsData.ts:245-259`) does:

```ts
cardMonth = monthTx.filter(method==="card").reduce(...)   // includes refunds
feesMonth = max(0, cardMonth) * 0.0175 + platformFeesTotal
effectiveFeeRate = feesMonth / receivedMonth * 100        // divides by NET
```

Three problems baked in:

1. **`cardMonth` is net of refunds**, but real gateway fees are charged on **gross** card volume. Refunding rarely returns the full fee. Using net under-states fees when there are no refunds and over-states the rebate when there are.
2. **`FEE_RATE = 1.75%` is hardcoded.** This is a guess layered on top of `platform_fees` rows, which already record the *actual* fee per transaction. When `platform_fees` has the row, the 1.75% estimate **double-counts**. When it doesn't, we invent a number that has no basis. Both violate the project's "live data only" rule (mem://constraints/no-hardcoded-fallbacks-live-data-only).
3. **`effectiveFeeRate` divides by `receivedMonth` (net)**, so a £38 payment fully refunded would show an infinite/spiked effective rate. It should be `fees ÷ gross card` to be meaningful, or hidden when gross card is 0.

A related side-issue: the loading-state stub initialises `effectiveFeeRate: FEE_RATE * 100` (1.75%) — a hardcoded value rendered before any data arrives. Should be 0.

## Fix

### `src/hooks/useInstructorPaymentsData.ts`

1. **Drop the 1.75% estimate entirely.** `feesMonth` becomes just the sum of `platform_fees.amount` for the month (which already includes `booking_fee`, `transaction_fee`, uplift, etc.).
   - If `platform_fees` is the source of truth for actual gateway/platform fees, this gives a real, reconcilable number.
   - If a payment method ever bypasses `platform_fees` insertion (e.g. legacy Square rows), the fees figure will read £0 for that period — that's the correct empty/needs-setup signal per the live-data rule, not a fabricated estimate.

2. **Recompute `effectiveFeeRate` against gross card volume**, not net received:
   ```ts
   const grossCardMonth = paidTx.filter(t => t.method === "card")
     .reduce((s, t) => s + t.amount, 0);
   const effectiveFeeRate = grossCardMonth > 0
     ? +((feesMonth / grossCardMonth) * 100).toFixed(2)
     : 0;
   ```
   This is what an instructor reads as "the % I'm paying on card sales".

3. **Remove hardcoded `FEE_RATE * 100`** from the loading-state stub; initialise `effectiveFeeRate: 0`.

4. **Delete the now-unused `FEE_RATE` constant** (or keep it only inside YTD calc — see below).

5. **YTD service-fees row (`feesYearToDate`)** currently also uses `cardYtd * FEE_RATE + platformYtd`. Apply the same fix: just use `platform_fees` rows since `taxYearStart`. Drop the card×1.75% estimate.

### What the user will see after the fix

For this instructor's current month (no `platform_fees` rows, one card payment of £38 with no refund-of-card):
- **Fees** £0.00
- **Effective rate** 0%

When real platform_fees rows exist (the other test instructor has £3 of platform_fees), Fees will read £3.00 against whatever gross card volume the month has.

## Out of scope
- No DB writes. If you want estimated fees in the absence of `platform_fees` rows, that's a separate "back-fill" story.
- No change to Outstanding, Next Payout, Cash Flow, transactions list.

## Question
Are you happy to switch fees to **actual recorded `platform_fees` only** (correct but reads £0 where the platform never wrote a row), or do you want me to keep an estimated fallback in some form (e.g. only when `platform_fees` is empty)?