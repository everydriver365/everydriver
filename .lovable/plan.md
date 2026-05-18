## Goal
When a pupil clicks **Pay Now** in the Drive365 pupil portal, let them pick from quick presets (Balance owed, Next lesson cost) or enter a custom amount, optionally add the admin (Service) fee, pay via Square, and have the payment recorded in `payment_history` against their instructor.

## Current state
- `PupilPortalPayments.tsx` → opens `PupilPaymentModal` → on mobile renders `PupilPaymentDrawer`.
- Drawer already supports: custom amount input, admin fee calculation (`useAdminFee`), Square wallet checkout, recent payments list.
- Missing: balance-owed / next-lesson-cost quick chips, explicit "Add Service Fee" toggle, and confirmed write-back to `payment_history` on success.

## Changes

### 1. `PupilPaymentDrawer.tsx` (mobile — primary surface for `/p/:slug`)
- Add a **preset chip row** above the amount input:
  - `Balance owed £X.XX` — visible only when `amountOwed > 0`, sets amount to `amountOwed`.
  - `Next lesson £Y.YY` — visible only when next lesson exists and has a positive cost.
  - `Custom` — clears/focuses input.
- Selected chip gets highlighted style; typing in the input deselects chips.
- Add a **Service Fee toggle** ("Add £{adminFee} Service Fee") right under the amount, defaulting to **on** when `hasFee && commissionPayer !== 'instructor'`. When off, pass `adminFee: 0` to the checkout call so `totalCharge = paymentAmount`.
- Keep the existing `pupil-payment-checkout` Square (`npi`) flow as the default action — rename button label to "Pay £{totalCharge} with card".
- Apple/Google Pay buttons already use Square; pass the toggled amount through.

### 2. Next-lesson cost source
- Add a small inline query in the drawer (only when `open === true`):
  ```ts
  supabase.from("scheduled_lessons")
    .select("id, lesson_date, start_time, duration_minutes, amount_due, price_per_hour")
    .eq("pupil_id", pupilId)
    .gte("lesson_date", today)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .order("lesson_date").order("start_time")
    .limit(1).maybeSingle();
  ```
- Cost = `amount_due ?? (price_per_hour * duration_minutes / 60)`. Hide the chip if neither is set (per the live-data-only rule — no fallbacks).

### 3. Payment recording
- `pupil-payment-checkout` already creates a Square checkout link via `square-checkout`; the existing **Square webhook handler** writes the row to `payment_history` and increments the pupil balance on `payment.updated` → COMPLETED. No new write needed; verify by checking the webhook function exists.
- I'll grep `square-webhook` to confirm; if it doesn't insert `payment_history`, I'll add the insert there. Either way, **no client-side balance mutation**.

### 4. `PupilPaymentModal.tsx` (desktop)
- Mirror the same chip row + Service Fee toggle for parity. Same logic, just shadcn `Dialog` styling.

## Out of scope
- No change to `PupilPortalPayments` screen layout, search, history card, or CSV export.
- No change to instructor-side payments.
- No new tables or migrations (using existing `scheduled_lessons.amount_due` / `price_per_hour` and existing `payment_history` write path).

## Files touched
- `src/components/pupil-portal/PupilPaymentDrawer.tsx` — add presets, fee toggle, next-lesson query.
- `src/components/pupil-portal/PupilPaymentModal.tsx` — same additions, desktop variant.
- `supabase/functions/square-webhook/index.ts` — verify it records into `payment_history`; patch if missing.
