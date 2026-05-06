## Add Pupil — Desktop Modal Redesign

Rebuild the visual layout of the Add Pupil modal in `src/components/instructor/pupils/AddPupilSheet.tsx`. Desktop only — mobile sheet stays on the current iOS-style design (per the project rule against unsolicited mobile changes). All existing submit, validation, address lookup, postcode → What3Words, and payment flows remain wired.

### Files

- `src/components/instructor/pupils/AddPupilSheet.tsx` — new desktop body, new fields, extended `AddPupilFormState`.
- `src/pages/InstructorPupils.tsx` — extend `addForm` initial state + reset block + extend the `pupils` insert to map new fields. No change to flow, validation, or post-add payment dialog.

### New form state (added to `AddPupilFormState`)

```ts
first_name: string
last_name: string
pickup_address: string
has_different_pickup: boolean   // default false
previous_experience: string
approx_hours: string            // hours typed as text, parsed on save
transmission: 'manual' | 'automatic' | ''
theory_passed: boolean          // default false
theory_pass_date: string        // yyyy-mm-dd
test_booked: boolean            // default false
test_centre_id: string          // selected id
test_centre_label: string       // display name
test_date: string               // yyyy-mm-dd
test_time: string               // HH:MM
custom_hourly_rate: string
```

`testCentreOpen` lives as local UI state inside the sheet (not persisted, not on `addForm`).

### DB mapping (existing columns on `public.pupils`, no migration needed)

| Form field | Pupils column |
|---|---|
| first_name + ' ' + last_name | `name` (single field per project rule) |
| pickup_address | `pickup_address` |
| previous_experience | `previous_experience` |
| approx_hours (parsed Number) | `lessons_completed` (existing field) |
| transmission | `transmission_type` |
| theory_passed | `theory_test_passed` |
| theory_pass_date | `theory_test_date` |
| test_date | `test_date` |
| test_time | `test_time` |
| test_centre_id | `test_centre_id` |
| custom_hourly_rate | `custom_hourly_rate` |

`has_different_pickup` and `test_booked` are UI toggles only; on save, if a toggle is off the corresponding column(s) are sent as `null`.

### Test centres source

Load from `instructor_test_centres` joined to `test_centres` for the current instructor (already used elsewhere in the app). Cache in a local `useEffect` inside `AddPupilSheet`. Falls back to all `test_centres` rows ordered by name if the instructor has none linked yet. Search filters client-side over the loaded list.

### Visual layout (desktop Dialog only)

Replace the current desktop body with the spec'd layout while keeping the existing mobile `Sheet` branch untouched.

```text
┌─ Dialog 580px, radius 20, bg #F8F9FB ─────────────┐
│ Header: blue tile + "Add pupil" + subtitle + ✕    │
├───────────────────────────────────────────────────┤
│ Scroll body, 5 sections separated by hairline:    │
│  1. Pupil details   (First/Last, Phone/Email,     │
│                      DOB/Sex)                     │
│  2. Address         (Search, Postcode/W3W,        │
│                      Pickup toggle → pickup addr) │
│  3. Experience &    (Prev exp, Hours/Trans,       │
│     testing         theory toggle → date,         │
│                      test booked toggle → centre  │
│                      dropdown + date/time)        │
│  4. Lesson prefs    (Lesson type, Duration,       │
│                      Hourly rate)                 │
│  5. Notes                                          │
├───────────────────────────────────────────────────┤
│ Footer: hint + Cancel / Add pupil (blue)          │
└───────────────────────────────────────────────────┘
```

Primitives implemented in-file: `FormSection`, `FieldLabel`, `TextInputField`, `SelectField`, `ToggleRow`. `isConditional` field state (green border + #F0FDF4 tint) only applied to fields revealed by a toggle (pickup address, theory date, test centre/date/time).

Address search keeps using the existing `GoogleAddressAutocomplete` rendered inside a `TextInputField` shell so the visual matches but the integration is unchanged. Postcode → What3Words lookup remains via `handlePostcodeLookup`.

The Sex, Lesson type, Duration, Transmission selects use the existing shadcn `Select` components wrapped in the new visual `SelectField` shell — no picker logic changes.

### Wiring rules

- Submit handler stays in `InstructorPupils.tsx`; only the insert payload is extended with the columns above.
- Validation rule stays the same (`name` derived from first+last, address, postcode required). If only one of first/last is filled, that becomes `name`.
- `handleClose` / `handleCancel` → existing `onOpenChange(false)`.
- Reset block in `setAddForm({...})` after successful save extended with the new defaults.
- Mobile branch (`useIsMobile() === true`) is left exactly as-is.
- No new libraries.

### Out of scope

- No changes to mobile sheet layout.
- No changes to the post-add payment dialog.
- No DB migration (all target columns already exist).
- No changes to RLS or fetch logic.
