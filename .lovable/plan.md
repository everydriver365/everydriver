## Payments page audit — tile by tile

| Tile | Source | Status |
|---|---|---|
| Hero · Net Earnings This Month / Last Month | `useDailyEarnings` → sums `payment_history.amount` for the month | ⚠ Sums **all** rows incl. negative ones (refunds + "Lesson Charge" debits). On your account this month, payment_history has 3 negative "Lesson Charge" rows totalling −£2,642.50, so the sum is < 0 and silently falls back to lesson-history estimate. Any mix of real payments + negative rows distorts the figure. |
| Hero · This Week / Per Hour | `lesson_history` × hourly rate | ✅ correct |
| Service fees YTD | `useInstructorPaymentsData` (card txns × 1.75% + platform_fees YTD) | ✅ correct |
| Platform deductions this month | `platform_fees` grouped by `kind` | ✅ correct |
| Owes Money | active pupils with `account_balance < 0` | ✅ fixed last round |
| Payments This Month (count) | `payment_history` count, `amount > 0`, this month | ✅ fixed last round |
| Course Rewards | `instructors.bonus_earned` | ✅ correct (display only) |
| Credit on Account | sum of positive `pupils.account_balance` | ✅ correct |

### Recording path — when a payment is actually taken

`TakePaymentModal` inserts into `payment_history` and calls `increment_pupil_balance` RPC. Page reactions:

| Surface | Refresh trigger | Status |
|---|---|---|
| Owes Money / Credit on Account | `onPaymentReceived` → `fetchPupils()` | ✅ |
| Payments This Month count | `onPaymentReceived` → `fetchRecentPaymentCount()` | ✅ |
| Realtime toast + recount on incoming payment | postgres_changes INSERT subscription | ✅ |
| **Hero Net Earnings (This Month / Last Month)** | nothing — `useDailyEarnings` query is never invalidated | ❌ stale until page reload |
| **Service fees YTD + Platform deductions** | nothing — `useInstructorPaymentsData` query is never invalidated | ❌ stale until page reload |
| Refund flow (`RefundModal.onRefunded`) | same — only pupils + count refresh | ❌ same problem |

## Plan

Two targeted changes, both in `useDailyEarnings` + `InstructorPay.tsx`. No business-logic changes; no DB changes.

### 1. Fix hero "Net Earnings This Month / Last Month" math

In `src/hooks/useDailyEarnings.ts` (lines 133–145), filter the two `payment_history` queries so only **real money in** counts toward earnings:

- add `.gt("amount", 0)` to both `thisMonthPaymentsRes` and `lastMonthPaymentsRes`

This makes the sum match "actual payments received this month" (same definition as the Payments-This-Month count tile) and stops negative Lesson Charge / refund rows from either inflating the figure or forcing the silent fallback to estimated lesson earnings.

### 2. Refresh the hero + fee tiles when a payment is recorded

In `src/pages/InstructorPay.tsx`:

- Pull `useQueryClient` from `@tanstack/react-query`.
- In the three places that already fire after a payment event — `TakePaymentModal.onPaymentReceived`, `RefundModal.onRefunded`, and the realtime INSERT handler — also invalidate the two React Query keys:
  - `["daily-earnings", instructorId]` (used by `useDailyEarnings`)
  - `["instructor-payments-data", instructorId]` (used by `useInstructorPaymentsData`)
- Confirm the exact query-key strings by reading both hooks first, then use those.

Result: taking a payment, receiving one in realtime, or issuing a refund will immediately update the hero earnings, Service fees YTD tile, and Platform deductions breakdown — matching what already happens for Owes Money / Credit on Account / Payments-This-Month count.

### Out of scope

- No schema changes.
- No changes to `TakePaymentModal`, `RefundModal`, or the `increment_pupil_balance` RPC — the write path is already correct.
- Quick-action tiles (Accounts, Expenses, Bonus, Mileage, Tax Summary) are pure navigation links; nothing to wire.
