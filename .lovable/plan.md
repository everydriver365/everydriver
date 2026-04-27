## Add New Pupil — premium redesign

Bring the "Add New Pupil" modal in `InstructorPupils.tsx` in line with the iOS-style design system used across the instructor portal (Notifications redesign, Waiting Room tiles, TermsSignatureModal).

### Scope
Visual treatment only. Every existing field, validation, save handler, What3Words lookup, payment-method behaviour, post-add payment dialog, and `?action=add` deep-link continue to work exactly as today.

### What changes

**Sheet container**
- On mobile (<640px): convert from centered `Dialog` to a bottom sheet (`vaul` Drawer, same primitive used in pupil portal payments) with rounded top (`rounded-t-2xl`), grab handle, max height 92dvh.
- On desktop (≥640px): keep `Dialog` but restyle to match — `rounded-2xl`, slate-gradient page bg behind, white sheet, 0.5px hairline border `#E4E4E7`.

**Header**
- Sticky top with frosted white (`bg-white/85 backdrop-blur-xl`) and hairline divider.
- Eyebrow "Pupils" in uppercase 11px tracked grey.
- Title "Add new pupil" 17px/600 Inter, sentence case (drop the title-case "Add New Pupil").
- Close (X) on left as text "Cancel" link; primary "Save" text link on right (system blue #007AFF), disabled until required fields valid. The big bottom button is removed in favour of this nav-style save.

**Body — grouped section cards**
Replace the flat list of inputs with three white tile cards (`bg-white`, `0.5px solid #E4E4E7`, `rounded-2xl`, `p-0`, hairline-separated rows) on the slate gradient backdrop:

1. **Pupil details**
   - Name *
   - Course type (chevron select row)
   - Email
   - Phone
   - Date of birth (with helper "Parent signature required for under-18s" — moved here, sentence case)

2. **Address**
   - Address autocomplete (Google) — full-width
   - Postcode (auto-filled)
   - What3Words with `///` prefix and inline spinner
   - Helper text 12px grey under the group, not per-field

3. **Payment**
   - Icon roundel 28×28 with `CreditCard`, slate `#2A394F` on `#E8ECF1`
   - Payment method select row
   - Contextual helper for `send_link` / `take_payment`

4. **Parent / guardian** (collapsible — collapsed by default to reduce visual weight; auto-expands if DOB indicates under-18)
   - Parent name
   - Parent phone
   - Helper "Parent uses this phone for portal access"

5. **Notes** (own card, single textarea, 4 rows, no border on textarea — borderless inside the card)

**Row styling**
- Each row: 52px min height, label 13px/500 left-aligned, input right-aligned with placeholder grey `#A1A1AA`.
- Selects render as right-aligned value + chevron `#A1A1AA` (matches Settings rows already in portal).
- Required asterisks rendered as a subtle red dot rather than `*`.
- Hairline divider between rows: `border-b-[0.5px] border-[#E4E4E7]` with 16px left inset (matches `mem://style/ios-consistency-patterns`).

**Typography & tone**
- Sentence case throughout (titles, labels, helpers, buttons).
- 24h time format if any time fields appear later.
- Helpers 12px `#71717A`.

**Validation feedback**
- Inline: invalid required field shows red dot and field tinted `#FEF2F2` until corrected.
- Save button disabled state already exists; keep `saving` spinner inline next to "Save" in the header.

**Empty-to-success transition**
- On save success, sheet animates closed and the existing post-add payment dialog opens unchanged.

### Out of scope
- No changes to `handleAddPupil` logic, DB writes, payment-link/QR edge functions, or the post-add payment dialog.
- Desktop pupils table page layout untouched.
- Mobile homepage and other mobile layouts untouched (per `mem://constraints/mobile-update-policy`).

### Files to edit
- `src/pages/InstructorPupils.tsx` — replace the Add Pupil `Dialog` block (lines ~657–858) with the redesigned sheet/dialog and section cards. Add a small local `SectionCard` + `Row` helper at the bottom of the file (or inline) to keep the diff localised; no new shared components required unless the helpers grow.
- Optional: extract to `src/components/instructor/pupils/AddPupilSheet.tsx` if the inline JSX exceeds ~250 lines after the redesign, to keep `InstructorPupils.tsx` readable.

### Technical notes
- Use existing `Drawer` from `vaul` (already in project for pupil portal payments) for the mobile bottom sheet; gate via `useIsMobile()` hook already used elsewhere.
- Reuse `GoogleAddressAutocomplete`, `Select`, `Input`, `Textarea`, `Label` primitives — only wrappers/styles change.
- Background uses existing `instructor-shell-bg` CSS var token; do not hard-code colours.
- Keep `data-*` attributes and existing refs so analytics/events continue firing.
