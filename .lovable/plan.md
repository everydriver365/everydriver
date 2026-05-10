## Goal
Remove the ADI Badge, Car Insurance, and DBS rows from the "Vehicle docs & CPD" section since they now live in the new Qualifications & credentials editor. Keep MOT and Road Tax (genuine vehicle docs) plus the existing CPD progress and DVSA Standards Check blocks.

## Changes

### `src/components/instructor/ComplianceTracker.tsx`
- Drop `adi_badge_number`, `adi_badge_expiry`, `car_insurance_expiry`, `dbs_certificate_expiry` from:
  - the `ComplianceData` interface
  - the `formData` state
  - the Supabase select + update payload
- Trim `complianceItems` to just MOT and Road Tax.
- Remove the corresponding ADI / Insurance / DBS fields from the "Edit Dates" dialog, leaving MOT date, Road Tax date, and CPD target.
- Keep CPD progress card, urgent alerts banner, and `<CompactStandardsCheck />`.
- Rename the Documents card title from "Documents & Expiries" to "Vehicle documents" for clarity.

No DB migrations and no changes to the Qualifications editor — the underlying columns stay in place (still written to by Qualifications).

### Out of scope
- No mobile-layout changes.
- No edits to other consumers of `ComplianceTracker` (`InstructorMenu.tsx`, `AccountHub.tsx`, `categories.tsx`) — they all just render the component, which keeps working.
