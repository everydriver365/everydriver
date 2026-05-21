
# Round 1 — Money Accuracy Audit + Fixes

Single focused pass on every High-severity money item. Audit first, then fix everything found in the same session, then report.

## Scope (locked)

Only these four areas. No Medium/Low items, no dashboard tiles, no navigation — those go to Round 2/3.

1. Earnings tiles wired to live data
2. Refund UI parity (badges + totals excluding refunds)
3. Email receipts (payment + refund)
4. Partial payment / partial refund math

---

## §1 Earnings tiles — verify live data

**Files to audit**
- `src/hooks/useInstructorPaymentsData.ts` (main source — already pulls from `payment_history`, `pupils.account_balance`, `platform_fees`)
- `src/components/instructor/EarningsDashboard.tsx` (separate fetcher — `thisMonth.amount`, `outstanding`, `hourlyRate`)
- `src/components/instructor/EarningsSummaryStrip.tsx`
- `src/components/instructor/PaymentSummaryWidget.tsx`
- `src/components/instructor/money/EarningsChart.tsx`
- `src/pages/InstructorPay.tsx`, `src/pages/instructor-app/InstructorPaymentsDesktop.tsx`

**Tiles to verify each derive live and exclude refunds correctly**
- Payments this month → `payment_history` sum, current calendar month, exclude `deleted_at`, decide refund handling (see §2)
- Per hour → `thisMonth.amount / totalHours` — confirm `totalHours` is from scheduled_lessons completed, not hardcoded
- Service fees YTD → UK tax year (6 Apr→5 Apr) card × 1.75% + `platform_fees`
- Platform deductions (month + YTD) → `platform_fees` rows split by `kind` (booking/transaction/uplift)
- Owes money → sum of `pupils.account_balance < 0`, count of those pupils

**Checks**
- No `|| <number>` fallback masking missing data (per `mem://constraints/no-hardcoded-fallbacks-live-data-only`)
- Empty/zero states render gracefully, not "—" hiding a real 0
- `EarningsDashboard.tsx` and `useInstructorPaymentsData.ts` agree on month totals (currently two separate fetches — risk of drift)

---

## §2 Refund UI parity

**Files**
- `src/components/instructor/PaymentHistory.tsx`
- `src/components/instructor/PupilPaymentHistory.tsx`
- `src/components/instructor/PaymentStatusBadge.tsx`
- `src/components/parent/ParentPaymentHistory.tsx`

**Fixes**
- Add a visible "Refunded" badge (red/destructive variant) on any row where amount is negative or `notes` contains refund marker
- Exclude refund rows from "Payments this month" and "Earnings totals" displays — OR show net with a clear "net of refunds" label
- Decide and apply consistently across all three lists. Current `useInstructorPaymentsData` line 227-231 nets refunds in — confirm that matches the new badge logic

---

## §3 Email receipts

**Files**
- `supabase/functions/square-webhook/index.ts` (line 283 already calls `send-payment-receipt`)
- `supabase/functions/square-refund/index.ts` (no receipt trigger currently)
- `supabase/functions/send-payment-receipt/index.ts`

**Fixes**
- Verify `send-payment-receipt` actually fires on Square webhook (logs, both OAuth and platform flows)
- Verify cash / bank transfer / GoCardless flows also send receipts (or document why not)
- Add refund receipt: either extend `send-payment-receipt` with a `type: "refund"` mode, or trigger inline from `square-refund` after the refund row is inserted
- Use existing app-emails infrastructure (`mem://infrastructure` rules — Lovable Email, idempotency key)

---

## §4 Partial payment / partial refund math

**Files**
- `supabase/functions/square-refund/index.ts`
- `src/components/instructor/RefundModal.tsx`
- DB RPC `increment_pupil_balance` (per `mem://core` — atomic balance updates only)

**Checks**
- On partial refund: `creditAmount = refundAmount - proportionalFee`. Verify the fee subtraction matches what was originally taken (don't double-subtract or skip)
- Pupil `account_balance` adjustment uses `increment_pupil_balance` RPC, not direct UPDATE
- `payment_history` insert for the refund row stores the negative amount and links via `external_payment_ref` (square refund id) — matches the §audit fixes already applied
- `platform_commissions` is reduced or reversed proportionally on refund (not currently — needs verification)
- Edge cases: full refund of partially-paid lesson; refund larger than original; refund when pupil balance currently positive

---

## Deliverable format

After fixing, post a single report:

**PART 1 — Issues found & fixed** (per item: file/area, what was broken, fix applied)
**PART 2 — Verified clean** (areas audited with no issues)
**PART 3 — Deferred to later round** (anything discovered that's outside Round 1 scope)

## Out of scope (Round 2+)

Dashboard tiles, navigation routes, form validation, empty states, notifications, UI polish.

---

Approve to proceed with the audit + fixes in one pass.
