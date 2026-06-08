## Goal
Let instructors record a block booking against a pupil (£ amount + hours bought) directly from the Add Pupil or Edit Pupil sheet. Money goes into the pupil's £ balance and shows in their payment history; hours go into their prepaid-hour balance and are automatically consumed when lessons are marked complete.

## How it works (user-facing)

**On Add Pupil / Edit Pupil sheet** — new "Block Booking" section:
- Toggle: "Record a block booking"
- Inputs: `£ Amount paid`, `Hours purchased`, `Payment method` (Cash / Card / Bank / Other), optional `Notes`
- Helper text shows derived rate (e.g. "£30/hr") so the instructor sees the maths.
- On save:
  1. Insert a row into `payment_history` — description like `Block booking: 10 hrs @ £30/hr`, amount = +£X (credit), payment_type `block_booking`.
  2. `increment_pupil_balance` RPC adds £X to `pupils.account_balance` (atomic, per project rule).
  3. Add the purchased hours to `pupils.prepaid_hours` in the same update.

**On Edit Pupil** the section is collapsible and can be used repeatedly to log additional top-ups. Existing prepaid hours and balance are shown as read-only context above the form.

**When a lesson is completed** (in `EndLessonWizard`, money path around line 285):
- Before charging the pupil's £ balance, check `pupils.prepaid_hours`.
- If `prepaid_hours >= lesson_hours` → decrement `prepaid_hours` by lesson hours, write a `payment_history` row (`amount = 0`, `payment_type = 'prepaid_hours'`, note `"Xh used from block booking (Yh remaining) — {duration}min lesson on {date}"`), set `scheduled_lessons.prepaid_hours_used = lesson_hours`. No £ deduction.
- If `0 < prepaid_hours < lesson_hours` → use up the remaining hours, then charge the £ shortfall via the existing money path (mirrors the intensive-hours pattern already in the file at lines 245–283).
- If `prepaid_hours = 0` → unchanged, existing money path runs.

This reuses the **exact pattern already in `EndLessonWizard` for `intensive_hours_paid`**, so behaviour is consistent with the National Intensive flow.

## Files to change

- `src/components/instructor/pupils/AddPupilSheet.tsx` — add Block Booking section + save-time insert.
- `src/components/instructor/EditPupilSheet.tsx` — same section, repeatable top-ups, shows current balances.
- `src/components/instructor/EndLessonWizard.tsx` — add a `prepaid_hours` branch before the money path (lines ~245–300), modelled on the intensive-hours code already there.
- Small helper `src/lib/recordBlockBooking.ts` — single function used by both sheets so logic stays in one place (insert payment_history, RPC for £, update prepaid_hours).

## Data model
No schema changes — uses existing columns:
- `pupils.prepaid_hours` (numeric) — already used for hour-balance display across the app.
- `pupils.account_balance` (numeric) — credited via existing `increment_pupil_balance` RPC.
- `payment_history` — new `payment_type` value `'block_booking'` (free-text column, no enum).
- `scheduled_lessons.prepaid_hours_used` — already populated by other flows.

## Out of scope
- No new "package" record (user chose free-form £ + hours, not the existing `pupil_packages` table).
- Pupil-facing portal copy stays as-is — the prepaid hours number it already shows will simply update.
- No refund / reverse-block UI in this pass (existing `RefundModal` can already adjust £; hours can be edited later as a follow-up if needed).

## Verify
1. Edit a pupil → record `£300 / 10 hours` cash → confirm payment_history shows the entry, £ balance +£300, prepaid hours +10.
2. Schedule a 2-hour lesson with that pupil, end it → prepaid hours drop to 8, £ balance unchanged, payment_history shows a `prepaid_hours` row.
3. Schedule a 9-hour lesson against the remaining 8h → prepaid hours go to 0, £ balance reduced by 1h worth, two payment_history rows written.
