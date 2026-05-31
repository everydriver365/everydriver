## Diagnosis

The "Net Received" figure is wrong because `payment_history` contains **non-payment ledger rows** that are being counted as refunds.

Recent rows in the database for the current month:

| amount | method | notes |
|---|---|---|
| −£810 | `Lesson Charge` | "NI" |
| −£787.50 | `Lesson Charge` | "Nat INtensive" |
| −£1,045 | `Lesson Charge` | "Nat Intensive" |
| −£38 | `Cash` | "Refund — twat" |

Only the last one is an actual refund. The three `Lesson Charge` rows are **balance-ledger debits** (pupil owes instructor for a booked lesson block) — never money moving in or out.

`normalizeStatus` flags them as `"refunded"` because `amount < 0`, so they:
- inflate `refundsMonth` by £2,642.50
- subtract from `receivedMonth`
- also get mis-classified as `card` method (since `normalizeMethod` defaults unknowns to `"card"`), polluting card totals and the fee calculation

## Fix

### `src/hooks/useInstructorPaymentsData.ts`

1. **Filter `Lesson Charge` rows out at source.** After fetching `paymentsRes.data`, drop any row whose `payment_method` matches `/lesson\s*charge/i` (case-insensitive, tolerant to spacing). These are ledger entries, not payments — they should never appear in the payments page transactions, stats, cash-flow, or fee calculations.

   Apply the same filter to `recentPaymentsRes`/`txByPupil` queries that feed pending payouts and pupil rollups (lines ~290 and ~328), so they stay consistent.

2. **Tighten `normalizeStatus`'s refund detection** as a defensive belt-and-braces: treat a row as `"refunded"` only when one of:
   - `payout_status` ∈ {`refunded`, `partially_refunded`}, OR
   - `notes` contains the word "refund", OR
   - `amount < 0` **AND** the row's `payment_method` is a recognised payment channel (card/cash/bank), not a ledger label.

   This ensures any future ledger-style entries don't get pulled in.

3. No change to `grossMonth` / `refundsMonth` / `receivedMonth` formulas — once the noise rows are gone, they'll be correct.

### Verification

Expected after fix, for the current month sample above:
- Gross = £38 (the one Square payment)
- Refunds = £38 (the cash refund)
- Net Received = £0

## Out of scope
- No DB migration. The `Lesson Charge` rows are legitimate balance-ledger entries used elsewhere (pupil balance) — they just don't belong on the Payments page.
- No change to the cash-flow chart shape, outstanding logic, or fee tiers beyond the consequence of removing these rows from the input set.

## Question
Confirm: it's safe to assume any `payment_history` row with `payment_method = "Lesson Charge"` is a balance-ledger entry that should be excluded from the Payments page, right? (If you sometimes use that label for real payments, tell me and I'll switch to a different exclusion key, e.g. exclude by `notes` pattern or a flag column.)