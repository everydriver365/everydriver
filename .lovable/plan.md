## Goal
On `/instructor/pay`, surface a breakdown of this month's money: **Gross paid**, **Refunded**, and **Net received** — instead of the single "Received" figure that silently nets refunds.

## Changes

### 1. `src/hooks/useInstructorPaymentsData.ts`
Compute two additional figures alongside existing `receivedMonth`:
- `grossMonth` = sum of `monthTx` rows with `status === "paid"` (positive amounts only)
- `refundsMonth` = absolute sum of `monthTx` rows with `status === "refunded"` (stored as negatives → report as positive)
- Keep `receivedMonth` = `grossMonth − refundsMonth` (same value as today, just expressed clearly)

Add to `PaymentsStats`:
```ts
grossMonth: number;
refundsMonth: number;
refundsCount: number;
```

Initialise them to 0 in the loading-state object.

### 2. `src/pages/instructor-app/InstructorPaymentsDesktop.tsx` (desktop `/instructor/pay`)
Replace the single emerald "RECEIVED" StatCard (line 258) with the three-figure breakdown. Two options — I'll go with **A** unless you prefer B:

**A. Keep 4-card row, replace Received with a stacked "Money in" card**
One emerald `StatCard` titled `MONEY IN · {MONTH}` whose `value` is the **Net** figure, with a two-line `sub` showing:
`Gross £X · Refunds −£Y · {n} payments`

Pros: preserves existing 4-column layout, no other tiles move.

**B. Expand to 5 tiles**
Separate `GROSS`, `REFUNDS` (rose), `NET RECEIVED` (emerald) cards, plus existing Outstanding / Next payout / Fees. Requires switching grid from `grid-cols-4` to `grid-cols-5` (or wrapping).

### 3. Mobile parity
`MoneyStack` / `MobileHomeDSM2026` currently only show `paymentsCount` + total. Mirror the chosen desktop treatment in `src/components/instructor/dashboardV2/MoneyStack.tsx` so the figures match across devices (small secondary line under the headline number).

## Out of scope
- No DB/schema changes — refunds already live in `payment_history` as negative `amount` rows.
- No change to YTD service-fees row, cash-flow chart, transactions list, or export logic.
- Pending/failed rows continue to be excluded.

## Question
Go with **A (compact, same 4-tile row)** or **B (5 separate tiles)**?