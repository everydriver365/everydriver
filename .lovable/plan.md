

## Plan: Make All Pupil Fields Editable + Add Instructor Reassignment in Admin

### What Changes

**1. Add instructor selector to the edit form**
- Add an `instructor_id` field to `detailsForm` state
- Render a `Select` dropdown populated from the existing `instructors` state, allowing the admin to move a pupil to a different instructor
- On save, include `instructor_id` in the update payload
- After save, move the pupil from the old instructor's group to the new one in local state

**2. Add missing editable fields to the form**
- `theory_test_date` (date input)
- `theory_test_passed` (select: Yes/No/Not taken)
- `prepaid_hours` (number input)
- `account_balance` (number input)
- `lessons_completed` (number input)
- `notes` (textarea — already editable separately, but add inline to the details form for consistency)

**3. Update the details form state and save logic**
- Extend `detailsForm` with the new fields
- Extend `populateDetailsForm` to populate them
- Extend `saveDetails` to include them in the update payload
- When `instructor_id` changes, re-bucket the pupil in the `pupils` grouped state

### File Modified
- `src/components/admin/PupilRecordsManager.tsx` — all changes in this single file

### Technical Details
- The instructor selector uses the already-fetched `instructors` array (no new queries needed)
- On instructor change, the pupil is removed from the old instructor's array and added to the new one in local state
- All fields map directly to existing columns on the `pupils` table — no schema changes required

