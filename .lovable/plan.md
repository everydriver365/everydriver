## Goal
Replace the current minimal "Add pupil" dialog in the instructor desktop portal (`InstructorPupilsDesktop.tsx`) with a richer intake form matching the mobile `AddPupilSheet` pattern. All fields will be **optional** (no hard `required` validations except character/format sanity checks).

## Fields to capture
| Field | DB column | Control |
|---|---|---|
| Name | `name` | text input |
| Address (postcode search) | `address` + `postcode` | `GoogleAddressAutocomplete` (auto-fills postcode) |
| What3words | `what3words` | text input + auto-lookup via `convert-to-what3words` edge fn |
| Date of birth | `date_of_birth` | date input |
| Sex | **new column `sex`** (text) | select: Male / Female / Prefer not to say |
| Previous experience (hours) | `previous_experience` (existing text col) | number input, stored as e.g. `"12 hours"` |
| Manual / Automatic | `transmission_type` | select: Manual / Automatic |
| Extra needs | `special_needs` | textarea |
| Comments | `notes` | textarea |
| Phone | `phone` | text input (kept) |
| Email | `email` | text input (kept) |
| Payment method | `payment_method` | select: TBC / Cash / Card / Bank transfer / Send link |

All fields optional — only inline format hints (email, postcode) shown if user types something invalid. No required asterisks.

## Database change
Add a nullable `sex` text column to `public.pupils` (no check constraint to keep flexible). Single migration.

```sql
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS sex text;
```

## UI changes (`src/pages/instructor-app/InstructorPupilsDesktop.tsx`)
- Replace the small `Dialog` body with a scrollable form grouped into sections:
  1. **Pupil details** — Name, Email, Phone, DOB, Sex
  2. **Address** — `GoogleAddressAutocomplete`, Postcode (auto), What3words (auto via edge fn `convert-to-what3words`)
  3. **Learning** — Previous experience (hrs), Transmission, Extra needs
  4. **Payment** — Payment method select
  5. **Comments** — notes textarea
- Increase dialog width to `sm:max-w-2xl`, add `max-h-[85vh] overflow-y-auto`.
- Inline soft-validation only: email format, UK postcode format. Never block submit; just show small red helper text under the field.
- Save handler: insert all provided fields (omit empty strings → `null`). Keep existing `setReloadTick` refresh + success toast.
- Remove "Name *" required indicator (now optional). Save button enabled unless any field has an active format error.

## Out of scope
- Edit pupil dialog will keep its current fields (separate task if user wants parity).
- No changes to mobile `AddPupilSheet`.
