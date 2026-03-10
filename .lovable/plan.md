

## Problem

The `ReassignPupilsDialog` currently fetches only a count of pupils and reassigns **all** of them in bulk with no option to pick specific ones.

## Plan

### Changes to `src/components/admin/ReassignPupilsDialog.tsx`

1. **Fetch full pupil list** instead of just count — query `id`, `name` from the `pupils` table filtered by `sourceInstructor.id` and `deleted_at is null`.

2. **Add a selectable pupil list** with checkboxes:
   - "Select All / Deselect All" toggle at the top
   - Each pupil row has a `Checkbox` + name
   - Scrollable area (`ScrollArea`) for long lists

3. **Update the reassign logic** to only update selected pupil IDs:
   - Use `.in("id", selectedIds)` instead of `.eq("instructor_id", ...)`
   - Update the count display to show "X of Y pupils selected"

4. **Update button text** to reflect selection: "Reassign X Pupil(s)"

### Interface changes
- Add `pupils` state array and `selectedPupilIds` set
- Replace `pupilCount` with derived values from the fetched list and selection

