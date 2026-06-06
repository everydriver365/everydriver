
# National Intensive Payment Hardening

Five-part improvement covering audit, UX, edge cases, history clarity, and balance display.

## 1. Backfill audit (one-off SQL)

Run a read-only query to find National Intensive pupils (`enquiry_id IS NOT NULL`) whose `payment_history` totals don't reconcile against `account_balance + (intensive_hours_paid * hourly_rate)`. Output a report to `/mnt/documents/intensive-balance-audit.csv` listing pupils with drift > £1. No auto-correction — user reviews and we fix manually like Joseph.

## 2. Payment recording UI — dual-outcome confirmation

When a payment is recorded for a National Intensive pupil:
- After successful insert, show a toast/dialog: **"£X credited + Yh prepaid added"**
- Affected component: the payment recording dialog used on pupil profile (locate via `record-payment` / `PupilPaymentDialog` search)
- Only triggers when `pupils.enquiry_id IS NOT NULL`

## 3. EndLessonWizard edge cases

Update `src/components/instructor/EndLessonWizard.tsx` hours-deduction block:

- **Null vs 0**: Treat `intensive_hours_paid` as `0` when null (already implicit, make explicit).
- **Partial hours**: If `intensive_hours_paid < lessonDuration` for a National Intensive pupil:
  - Deduct all remaining hours from `intensive_hours_paid` (set to 0)
  - Charge the *remainder* (lessonDuration - hoursPaid) × hourly_rate against money balance via `increment_pupil_balance`
  - Log two `payment_history` rows: one Adjustment for hours, one Lesson Charge for the £ remainder
- **Cancel/refund flow**: Audit `softDeleteLesson.ts` and any cancel paths. If a National Intensive lesson is cancelled after EOL, restore hours (not money) when the original deduction was hours-based. Detect by checking the lesson's payment_history entry type.

## 4. Payment history — dedicated `intensive_hours` type

Currently hours deductions log as `Adjustment` (ambiguous). Add a new payment type:
- Update display logic in payment history components to render `intensive_hours` as **"–Xh Intensive Hours"** with a clock icon, not a £ amount
- Update `EndLessonWizard.tsx` to write `payment_type: 'intensive_hours'` instead of `'Adjustment'`
- Update any payment-type enums/filters (search `payment_type` usages)
- No DB schema change needed if `payment_type` is freetext; if it's an enum, add a migration to extend it

## 5. Balance widget — hours-first for National Intensive

In pupil profile balance widget(s):
- If `pupils.enquiry_id IS NOT NULL` AND `intensive_hours_paid > 0`:
  - Show **"42.5h remaining"** as the primary large number
  - Show **"£1,487.50 credit"** as secondary
- Otherwise: existing £-first layout
- Locate: `PupilBalanceCard` / pupil detail header / parent top-up card

## Technical Section

**Files to touch (estimated):**
- `src/components/instructor/EndLessonWizard.tsx` — partial-hours split, payment_type rename
- `src/lib/softDeleteLesson.ts` + cancel handlers — hours restoration on cancel
- Pupil payment dialog (TBD via grep `record_payment`)
- Pupil balance card component(s)
- Payment history row renderer (TBD via grep `payment_type`)
- `/mnt/documents/intensive-balance-audit.csv` — generated, not committed

**Out of scope:**
- Mobile layout changes (per project rule)
- Refactoring the `increment_pupil_balance` RPC
- Adding `intensive_hours_remaining` as a generated column (could be a follow-up)

**Order of execution:**
1. Audit query first (read-only, surfaces real drift before we ship logic changes)
2. EndLessonWizard partial-hours + payment_type
3. Payment history renderer
4. Balance widget hours-first
5. Cancel/refund hours restoration
6. Dual-outcome confirmation toast
