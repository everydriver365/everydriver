## What happened to Soraya

Soraya has `intensive_hours_paid = 22.50` (National Intensive client, £787.50 paid up front — that matches the -£787.50 refund/payout row). But her pupil record has **no `enquiry_id`**, and `EndLessonWizard.tsx` (line 249) only treats a pupil as intensive when `enquiry_id` is set. So when today's lesson was completed the system fell through to the "money" branch and posted a **-£50 Lesson Charge**. Someone then tapped "Included in package" to cancel it out, which inserted the **+£50 Voucher / "Included in package"** row. Both rows are wrong — for an intensives pupil only the hours counter should move.

The +£2 Square row from 31 May is a real Square Checkout payment (ref `lctiP4OILcdc2OXa26b7mxqAXOCZY`) — not invented. We'll leave it alone unless you tell us otherwise.

## Fix plan

### 1. Make intensives detection robust (code)
In `src/components/instructor/EndLessonWizard.tsx` change the intensive check from:
```
const isNationalIntensive = Boolean(fresh?.enquiry_id);
if (isNationalIntensive && lessonHours > 0 && intensiveAvailable > 0) { ... }
```
to simply:
```
if (lessonHours > 0 && intensiveAvailable > 0) { /* intensive hours branch */ }
else if (lessonHours > 0 && prepaidAvailable > 0) { /* prepaid branch */ }
else { /* money branch */ }
```
i.e. **any pupil with `intensive_hours_paid > 0` is billed in intensive hours first**, regardless of whether `enquiry_id` is linked. This also matches how `prepaid_hours` already works (no enquiry link required).

### 2. Hide the "Included in package" button for intensives/prepaid pupils (code)
In `src/components/instructor/end-lesson/StepPayment.tsx`, only show the "Included in package" / Voucher button when the pupil has neither `intensive_hours_paid > 0` nor `prepaid_hours > 0`. Intensives never need it.

### 3. Clean up Soraya's wrong entries (data)
Run a data fix (single migration / insert) that:
- Soft-deletes payment_history row `66f16b65…` (-£50 Lesson Charge today)
- Soft-deletes payment_history row `dd8c8887…` (+£50 Voucher today)
- Calls `increment_pupil_balance(pupil, 0)` — net change is zero because the two rows already cancel — so `account_balance` stays at -£785.50. (If you'd prefer the balance to reset to £0 / match the intensive payment model, say so and we'll add a one-off adjustment.)
- Decrements `intensive_hours_paid` from 22.50 → 21.50 (the 1-hour lesson on 2026-06-08).
- Inserts a `payment_method: 'Intensive Hours'` ledger row for the 1h used on today's lesson, to keep her timeline consistent with how intensives are normally recorded.

### 4. Out of scope (confirm before doing)
- The +£2 Square payment on 31 May — real Square transaction; leave as-is unless you want it refunded/soft-deleted.
- The -£787.50 refund row labelled "Nat INtensive" — looks like the original course payout entry; leaving it.

Shall I proceed with all three fixes above?
