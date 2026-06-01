## Why it fails today

The end-of-lesson **Take payment** step (`StepPayment.tsx`) inserts into `payment_history` with `payment_method` set to lowercase tokens — `"cash"`, `"card"`, `"bank_transfer"`. The DB has a `validate_payment_method` trigger that only allows a fixed set of Title-Case labels: `Cash`, `Bank Transfer`, `Square`, `GoCardless …`, `Klarna`, `Clearpay`, `SumUp`, `Lesson Charge`, `Free`, `Refund`, `Adjustment`, `Voucher`, etc. Every insert from EOL therefore raises `check_violation` → toast "Failed to record payment". (RLS is fine — both insert policy and `get_instructor_id_for_user` work.)

## Changes

### 1. Fix the payment-method mapping (frontend only)

In `src/components/instructor/end-lesson/StepPayment.tsx`:

- Change the `METHODS` segmented control values so each option carries the exact DB-allowed label:
  - Cash → `"Cash"`
  - Card → `"Square"` (this is the canonical card label the trigger accepts and is consistent with `record-payment` edge function)
  - Transfer → `"Bank Transfer"`
- Pass that label straight through as `payment_method` (no further normalisation needed).

No schema change; the trigger already accepts these.

### 2. Add "No payment due" and "Included in package" settlement options

Same file. Below the amount/method block (or as a small secondary row), add two tertiary buttons: **No payment due** and **Included in package**. Picking either bypasses the amount input and writes a settlement row instead of a normal payment:

- **No payment due** — lesson is comped. Insert one row with `amount = lessonCost`, `payment_method = "Free"`, `payment_type = "adjustment"`, `notes = "No payment due — recorded at end of lesson"`, plus `increment_pupil_balance(+lessonCost)`. This cancels out the `Lesson Charge` the wizard always posts, so the pupil's balance ends unchanged.
- **Included in package** — pupil already paid up front. Insert with `amount = lessonCost`, `payment_method = "Voucher"`, `payment_type = "lesson_payment"`, `notes = "Included in package"`, plus `increment_pupil_balance(+lessonCost)`. Same net effect on balance, but kept as a lesson_payment so reporting still treats it as paid.

Both share the existing `handleRecord` plumbing: same `payment_history` insert + `increment_pupil_balance` RPC + `invalidatePaymentQueries` + `onPaymentRecorded()` advance. Disable them while `saving`. Skip the amount validation for these two (`canRecord` only gates the manual Cash/Card/Transfer path).

UI: keep it iOS-clean — show the two options as a `.portal-list`-style pair of full-width rows under a small "Other" section header, with subtle icons (e.g. `Gift` for No payment due, `Package` for Included in package). No new colours; use existing `C.muted` / `C.link` tokens.

### 3. Nothing else changes

- `EndLessonWizard.tsx` still inserts the `Lesson Charge` debit; the two new settlement rows offset it.
- No DB migration, no RLS change, no edge-function change.
- Admin TakePayment / record-payment edge function already use the correct labels, so they're unaffected.

## Files touched

- `src/components/instructor/end-lesson/StepPayment.tsx` — relabel methods, add two settlement actions and their handler.
