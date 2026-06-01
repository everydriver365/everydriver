## Driving Test tile + cross-surface display

All required fields already exist on `pupils`: `test_date`, `test_time`, `test_centre_id`, `test_passed`, `test_result_date`. No DB migration needed. `test_centres` table is the live list.

### 1. `PremiumPupilProfile.tsx` — new `DrivingTest` tile
Add a `Card` block between the existing `TheoryTest` tile and `ProgressOverview` (mirrors theory tile pattern). States:
- **Passed** — green check + `test_result_date`
- **Not passed** — red X + `test_result_date` (when `test_passed = false` and no future `test_date`)
- **Booked** — calendar icon + `test_date` (EEE d MMM), `test_time` (HH:MM), centre `name` + `postcode` from `test_centres` (live query by `test_centre_id`)
- **Not booked** — empty CTA "Book practical test"

Tap behaviour: opens `EditPupilSheet` (existing `editOpen` state). Also keep the existing small inline `EditableRow` fields for date/time below (unchanged).

Add a `useQuery(["test-centre", pupil.test_centre_id])` returning `name, postcode`.

### 2. `EditPupilSheet.tsx` — new "Practical test" section
Placed directly under the existing "Theory test" section. Fields:
- Status select: Not booked / Booked / Passed / Not passed
- Date input (`test_date`)
- Time input HH:MM (`test_time`)
- Centre select from `test_centres` where `is_active = true`, ordered by `name` (live list)
- Result date (`test_result_date`) shown only when status = Passed/Not passed

Save payload maps to: `test_date`, `test_time`, `test_centre_id`, `test_passed` (true/false/null), `test_result_date`. Hydrate `practical_status` from pupil on load (same pattern as theory).

### 3. `ExpandablePupilCard.tsx` — surface on the pupil list
The card already imports `test_date`. Add a small badge row in the collapsed header when `test_date` is in the future: calendar icon + `EEE d MMM` + `HH:MM` + centre name (from a batched centre lookup already used elsewhere, or extend the existing query to join `test_centre_id` → name). Pass `pupil.test_time` and `test_centre_id` through the existing select.

### 4. `BrandedPupilPortal.tsx` — pupil-facing display
Extend the pupil select to also fetch `test_time`, `test_centre_id`, `test_passed`, `test_result_date`. Add a compact "Driving test" card near the existing `hasTestBooked` usage (PortalCard styling) showing the same four states as the profile tile, read-only. Centre `name + postcode` resolved via a single `test_centres` lookup. No edit controls.

### Out of scope
- No DB schema changes, no migration, no RLS changes.
- No changes to `UpcomingTestsView`, `QuickTestResultForm`, `TestDayPrep`, `driving_tests` history rows.
- No mobile layout restructuring beyond adding the tile/badge in existing flows.
- No instructor dashboard widget changes (UpcomingTestsView already exists).
