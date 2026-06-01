# Prebooked hours on mobile pupil record

On the DSM mobile pupil profile (`/instructor/pupils/:pupilId` → `src/pages/PremiumPupilProfile.tsx`), the financial summary card currently shows two cells: **Amount due** and **Prepaid hours**. The "Prepaid hours" cell reads `pupil.prepaid_hours` only, so for intensive pupils like Joseph (`prepaid_hours = 0`, `intensive_hours_paid = 42.50`) it incorrectly shows `0.0`.

## Change

Replace the "Prepaid hours" cell with a **Prebooked hours** cell that shows the total hours the pupil has actually bought.

- **Label:** `Prebooked hours`
- **Value:** `(pupil.prepaid_hours ?? 0) + (pupil.intensive_hours_paid ?? 0)`, formatted with `.toFixed(1)`
- **Sub-line (under value):**
  - If `intensive_hours_paid > 0` and `prepaid_hours > 0`: `Intensive 42.5 · Prepaid 5.0`
  - If only `intensive_hours_paid > 0`: `Intensive course`
  - If only `prepaid_hours > 0`: keep the existing `payment_type` capitalised line
  - If both are 0: `Nothing prebooked`

For Joseph this renders `42.5` with sub-line `Intensive course`.

## Editing behaviour

The current cell is tap-to-edit and writes back to `prepaid_hours`. Since the new value is a derived total across two fields, **drop the inline edit** on this cell — editing intensive/prepaid hours stays in the existing Edit Pupil sheet (`EditPupilSheet.tsx`) and Add Pupil flow, which already handle both fields. This keeps a single source of truth and avoids ambiguity about which field a tap-edit would mutate.

## Scope

- Only `src/pages/PremiumPupilProfile.tsx` is touched.
- No schema changes, no data backfill, no other components, no desktop changes.
- Existing `saveHours`, `editHours`, `hoursDraft` state for that cell is removed (unused after the edit affordance is dropped).

## Verification

After the change, Joseph (`53011379-5cf6-4385-9e9c-544d3e9ae961`) shows `Prebooked hours 42.5` with sub-line `Intensive course`, and a regular learner with `prepaid_hours = 10` continues to show `10.0`.
