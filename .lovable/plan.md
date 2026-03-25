

## Fix Payment & Fee Calculation Bugs

After inspecting every file, here's the status of each bug and what actually needs changing.

### Bug Assessment

| # | File | Status | Action |
|---|------|--------|--------|
| 1 | `square-booking-wallet-payment` | **Already implemented** — 340 lines of working code, not a stub | No change needed |
| 2 | `square-wallet-payment` — race condition | **Valid** | Fix: replace read-then-write with `increment_pupil_balance` RPC |
| 3 | `square-wallet-payment` — diverging timestamps | **Valid** | Fix: single `ts` variable reused |
| 4 | `square-payment` — swallowed DB errors | **Valid** | Fix: return partial-success flag on DB failure |
| 5A | `square-checkout` — missing cancelUrl | **Valid** | Fix: add `cancel_url` to checkout_options |
| 5B | `square-checkout` — environment check | **Valid** | Fix: standardise to multi-alias pattern |
| 6 | `SquarePaymentForm` — null check | **Already guarded** (line 87) | No change needed |
| 7 | `SquarePaymentForm` — customerPhone unused | **Valid** | Fix: pass `customerPhone` in processPayment body |
| 8 | `TakePaymentModal` — `clearForManual` | **Actually used** — bound to checkbox `checked` prop (line 373) and read in logic (line 91) | No change needed |
| 9 | `useInstructorTierConfig` — return type | **Already present** (line 15) | No change needed |
| 10 | `OrderReviewSummary` — unused `Clock` import | **Valid** — imported but never referenced in JSX | Fix: remove from import |

### Changes to Make

**`supabase/functions/square-wallet-payment/index.ts`** (bugs 2 & 3):
- Replace two separate `Date.now()` calls with one shared `ts` constant
- Replace manual balance read-then-write with `supabase.rpc("increment_pupil_balance", ...)`
- Still fetch pupil name for notification text

**`supabase/functions/square-payment/index.ts`** (bug 4):
- Wrap DB operations in try/catch that returns `{ success: true, dbError: "..." }` on failure
- Reorder: RPC first, then payment_history insert, then payment_intents update
- On DB error, return 200 with `dbError` flag so frontend can alert user

**`supabase/functions/square-checkout/index.ts`** (bug 5):
- Add `cancel_url: body.cancelUrl || returnUrl` to checkout_options
- Standardise environment detection to `env.toLowerCase()` with `production/prod/live` aliases

**`src/components/payments/SquarePaymentForm.tsx`** (bug 7):
- Add `customerPhone` to the destructured props (it's in the type but not destructured)
- Pass it in the `processPayment` invoke body

**`src/components/booking/OrderReviewSummary.tsx`** (bug 10):
- Remove `Clock` from the lucide-react import

### Files Modified
- `supabase/functions/square-wallet-payment/index.ts`
- `supabase/functions/square-payment/index.ts`
- `supabase/functions/square-checkout/index.ts`
- `src/components/payments/SquarePaymentForm.tsx`
- `src/components/booking/OrderReviewSummary.tsx`

### Skipped (no change needed)
- Bug 1: `square-booking-wallet-payment` is already fully implemented
- Bug 6: googlePay null guard already exists
- Bug 8: `clearForManual` is actively used in UI and logic
- Bug 9: return type annotation already present

