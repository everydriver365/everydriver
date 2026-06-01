## Quick-edit modals for Theory & Driving test tiles

Tapping either tile on the pupil profile currently opens the full `EditPupilSheet`. Replace that with two small focused dialogs.

### New components
- `src/components/instructor/TheoryTestQuickEdit.tsx`
- `src/components/instructor/DrivingTestQuickEdit.tsx`

Each uses the existing shadcn `Dialog` (compact, centered, ~360–420px wide) with:
- Status select (Not taken/booked, Booked, Passed, Not passed)
- Conditional fields matching the existing EditPupilSheet logic:
  - **Theory**: date, centre select (`theory_test_centres`), cert number (passed only)
  - **Driving**: date, time, test centre select (`test_centres`), result date (passed/failed only)
- Save → updates only the test fields on `pupils` (`theory_test_*` or `test_*`), toasts, invalidates `["pupil-profile", ...]`, closes.
- Cancel/X dismiss without saving.

Reuses the same centre queries already in `PremiumPupilProfile.tsx` (no duplicate fetch logic — pass centres list as prop or each modal does its own one-shot fetch on open).

### Wiring
In `src/pages/PremiumPupilProfile.tsx`:
- Add `theoryEditOpen` and `drivingEditOpen` state.
- `TheoryTest` button → `setTheoryEditOpen(true)` instead of `setEditOpen(true)`.
- `DrivingTest` button → `setDrivingEditOpen(true)`.
- Render `<TheoryTestQuickEdit>` and `<DrivingTestQuickEdit>` at the same level as the existing `EditPupilSheet`, passing `pupil` and `onSaved` (invalidates the profile query).

### Out of scope
- No DB changes.
- `EditPupilSheet` keeps its Theory/Practical sections (used by the main Edit button and other entry points).
- No changes to pupil portal, pupil list card, or `UpcomingTestsView`.
