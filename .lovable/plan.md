

## Add Editable Profile Fields to Pupil Portal

**Problem**: The "My Profile" tab only shows name, email, and phone as read-only text. The pupil cannot enter or edit key details.

**No database changes needed** — the `pupils` table already has all required columns: `date_of_birth`, `driver_number`, `theory_cert_number`, `address`, `postcode`, `pickup_address`, `what3words`, `phone`, `email`.

### Changes

**1. `src/pages/BrandedPupilPortal.tsx`**
- Expand the `Pupil` interface to include: `date_of_birth`, `driver_number`, `theory_cert_number`, `address`, `postcode`, `pickup_address`, `what3words`
- Update the `.select()` query to fetch these new fields
- Replace the static profile section with a new `PupilPortalProfileEdit` component, passing `pupil`, `setPupil`, and `brandColour`

**2. Create `src/components/pupil-portal/PupilPortalProfileEdit.tsx`** (new file)
- Renders the profile picture upload (existing component) at the top
- Below, renders editable fields using `InlineEditField` for:
  - **Date of Birth** (type `date`)
  - **Driver Number** (text)
  - **Theory Certificate Number** (text)
  - **Phone** (type `tel`)
  - **Email** (type `email`)
  - **Home Address** — uses `PostcodeAutocomplete` for postcode lookup, plus a text field for full address
  - **Pick-up Location** — text field for what3words value (with `///` prefix display)
- Each field saves directly to the `pupils` table on edit via `supabase.from("pupils").update(...)` 
- Updates local `pupil` state via `setPupil` callback after successful save

