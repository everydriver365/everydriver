## Goal

Tag `payment_type` on every `payment_history` insert site, then backfill historical rows so the income filter in `useInstructorTaxSummary` (and any future consumers) reflects accurate categories.

Strictly additive: no amount, flow, or logic changes.

## Mapping (no ambiguity)

| Insert site | payment_type |
|---|---|
| Positive payments via Square / Klarna / Clearpay / GoCardless / manual / wallet / booking | `lesson_payment` |
| Refund flows (`square-refund`, `RefundModal`, Square webhook refund branch, any negative-amount insert) | `refund` |
| No-show charges (`MultiDayScheduleView`, `CancelLessonDialog`, anywhere `No-Show Fee` is recorded) | `no_show_fee` |
| Cancellation fees | `cancellation_fee` |
| Subscription billing inserts | `subscription` |

## PART 1 — Tag insert sites

### Frontend (`src/components/instructor/...`)
1. `CancelLessonDialog.tsx:155` — cancellation/no-show branch. Inspect surrounding code: if it's a no-show charge → `no_show_fee`; if cancellation fee → `cancellation_fee`. Add `payment_type` to the insert object.
2. `EndLessonWizard.tsx:227` → `lesson_payment`.
3. `MultiDayScheduleView.tsx:774` (No-Show Fee insert) → `no_show_fee`.
4. `NewMobileScheduleView.tsx:241` — inspect; if no-show charge → `no_show_fee`, else `lesson_payment`.
5. `PupilPaymentsManager.tsx:84` → `lesson_payment`.
6. `TodayScheduleView.tsx:397` — inspect like #4.
7. `end-lesson/StepPayment.tsx:114` → `lesson_payment`.
8. `RecordPaymentModal.tsx:211` → `lesson_payment`.
9. `RefundModal.tsx:149` and `:222` → `refund`.
10. `TakePaymentModal.tsx:98` (realtime channel insert) → `lesson_payment` if it actually inserts a row; skip if it's only a subscription listener.

### Edge functions (`supabase/functions/...`)
11. `record-payment/index.ts:105` and `:129` → `lesson_payment`.
12. `klarna-order/index.ts:146` / `:152` / `:170` → `lesson_payment`.
13. `clearpay-capture/index.ts:66` / `:130` → `lesson_payment`.
14. `create-booking/index.ts:401` → `lesson_payment`.
15. `gocardless-webhook/index.ts:227` → `lesson_payment` (DD/IBP captured payments).
16. `payment-callback/index.ts:176`, `:401`, `:582` → `lesson_payment`.
17. `square-booking-wallet-payment/index.ts:238` → `lesson_payment`.
18. `square-payment/index.ts:198` → `lesson_payment`.
19. `square-wallet-payment/index.ts:146` → `lesson_payment`.
20. `square-webhook/index.ts:235` (capture branch) → `lesson_payment`.
21. `square-webhook/index.ts:585` — refund branch → `refund`.
22. `square-refund/index.ts:161` → `refund`.
23. `voice-execute/index.ts:294` — inspect; almost certainly `lesson_payment`.

Each edit is a one-line addition inside the existing insert object literal — no flow change, no field rename, no amount adjustment.

## PART 2 — Historical backfill migration

Single migration file with two updates:

```sql
UPDATE public.payment_history
SET payment_type = 'lesson_payment'
WHERE amount > 0 AND payment_type IS NULL;

UPDATE public.payment_history
SET payment_type = 'refund'
WHERE amount < 0 AND payment_type IS NULL;
```

This leaves zero-amount rows (if any) untagged, which is correct — the income filter already tolerates `NULL`.

## PART 3 — Verified clean (no changes)

- `ukTax.ts` — untouched (source of truth).
- `useInstructorTaxSummary.ts` — filter already live, will start excluding `platform_fee` / `commission` automatically once those tags appear.
- All accounting-sync, refund-amount, payout, and Square webhook business logic — untouched.
- `payment_history` schema — no further migration (check constraint already accepts all values used).

## PART 4 — Deferred

- `platform_fee` / `commission` tags: no insert site currently writes these as separate rows, so no tagging to do today. When a future site does (e.g. a fee-skim writer), it must use the new values.
- Subscription billing inserts — confirm whether any subscription edge function writes to `payment_history`; current grep shows none. If one is added later it should use `subscription`.
- Affiliate signup flow (Xero/accounting) — to be actioned in the next loop after this pass lands.

## Files touched

Code edits (≈22 one-line additions across):
- `src/components/instructor/CancelLessonDialog.tsx`
- `src/components/instructor/EndLessonWizard.tsx`
- `src/components/instructor/MultiDayScheduleView.tsx`
- `src/components/instructor/NewMobileScheduleView.tsx`
- `src/components/instructor/PupilPaymentsManager.tsx`
- `src/components/instructor/TodayScheduleView.tsx`
- `src/components/instructor/end-lesson/StepPayment.tsx`
- `src/components/instructor/RecordPaymentModal.tsx`
- `src/components/instructor/RefundModal.tsx`
- `supabase/functions/record-payment/index.ts`
- `supabase/functions/klarna-order/index.ts`
- `supabase/functions/clearpay-capture/index.ts`
- `supabase/functions/create-booking/index.ts`
- `supabase/functions/gocardless-webhook/index.ts`
- `supabase/functions/payment-callback/index.ts`
- `supabase/functions/square-booking-wallet-payment/index.ts`
- `supabase/functions/square-payment/index.ts`
- `supabase/functions/square-wallet-payment/index.ts`
- `supabase/functions/square-webhook/index.ts`
- `supabase/functions/square-refund/index.ts`
- `supabase/functions/voice-execute/index.ts`

One new migration for the backfill UPDATEs.

Sites flagged "inspect" (`CancelLessonDialog:155`, `NewMobileScheduleView:241`, `TodayScheduleView:397`, `voice-execute:294`) will be classified by reading the surrounding 20 lines before tagging — if any turns out to be genuinely ambiguous it goes in PART 4 deferred with a one-line note rather than being guessed.