## Goal
Bring the desktop **Edit Pupil** dialog (`InstructorPupilsDesktop.tsx`) up to parity with the Add Pupil dialog so instructors can edit the same optional intake fields after creation.

Fields to add to Edit:
- Address (with postcode autocomplete) → auto-fills postcode + what3words
- What3words
- Date of birth
- Sex (male / female / prefer not to say)
- Previous experience (hours)
- Transmission (manual / automatic)
- Extra needs
- Notes
- Payment method (tbc / cash / card / bank transfer / send link)

Existing Edit-only fields (name, phone, email, postcode + their validation) are preserved and continue to use the same `EMAIL_RE`, `UK_POSTCODE_RE`, `UK_PHONE_RE` rules already used by Add.

## Changes (single file: `src/pages/instructor-app/InstructorPupilsDesktop.tsx`)

1. **Edit form state** — replace the small `{ name, phone, email, postcode }` shape with the full intake shape, mirroring `addForm`. Add `editLookingW3W` boolean.

2. **`openEdit(id)`** — extend the `select(...)` to pull `address, what3words, date_of_birth, sex, previous_experience, transmission_type, special_needs, notes, payment_method`, and hydrate the new state fields. `previous_experience` (numeric) is stringified for the input.

3. **`handleSaveEdit()`** — keep current validation, then `update()` with all the new columns. `previous_experience` is parsed back to a number or null. Empty strings become `null`. `postcode` is upper-cased. `payment_method` defaults to `"tbc"` if blank.

4. **Postcode autocomplete helper** — add `handleEditPostcodeAutoFill(postcode)` that mirrors the Add equivalent: sets postcode, then invokes the `convert-to-what3words` edge function and fills `editForm.what3words`.

5. **Edit dialog JSX** — restructure the dialog body into the same five sections used by Add:
   - Pupil details: Name (req), Phone, Email, DOB, Sex
   - Address: `GoogleAddressAutocomplete` (binds to `editForm.address`, calls `handleEditPostcodeAutoFill`), Postcode, What3words (with `Loader2` spinner when `editLookingW3W`)
   - Learning: Previous experience hours, Transmission, Extra needs
   - Payment: Payment method `Select`
   - Comments: Notes textarea
   
   Reuse the existing imports (`GoogleAddressAutocomplete`, `Select`, `Textarea`, `Loader2`) — all already imported for the Add dialog.

6. **Dialog sizing** — bump `DialogContent` from `sm:max-w-md` to `sm:max-w-2xl max-h-[85vh] overflow-y-auto` to match the Add dialog so the longer form scrolls cleanly.

## Out of scope
- Mobile `EditPupilSheet` (instructor mobile layouts are not changed unless explicitly instructed — see Mobile update policy).
- No DB migration needed — all target columns already exist on `public.pupils`.

## Acceptance
- Opening Edit on an existing pupil shows their current values for every new field.
- Selecting a new address auto-fills postcode and what3words via the edge function.
- Saving updates all fields in one round-trip; toast confirms; the pupils list and detail panel reflect the changes.
- Validation behaviour for name / phone / email / postcode is unchanged.
