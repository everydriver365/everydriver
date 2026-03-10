

## Add Individual Pupil Reassignment on Instructor Profile

### Problem
The instructor profile page has a "Reassign Pupils" button that opens a bulk dialog. There is no way to reassign a single pupil directly from the instructor's pupil list on the profile page. The profile page doesn't even show the instructor's pupils.

### Plan

**1. Add a "Pupils" section to `AdminInstructorProfile.tsx`**

Add a new `SectionPanel` that lists all pupils belonging to this instructor. Each pupil row will have:
- Pupil name
- A small "Reassign" dropdown (Select component) showing other active instructors — selecting one immediately reassigns that single pupil
- Confirmation toast on success

This uses the same pattern as `PupilRecordsManager.tsx` which already has per-pupil reassignment via a Select dropdown.

**2. Keep the existing bulk "Reassign Pupils" button**

The bulk dialog remains available in the action bar for moving multiple pupils at once. The new per-pupil dropdown is for quick individual reassignment.

### Files to change
- **`src/components/admin/AdminInstructorProfile.tsx`** — Add a "Pupils" section panel with pupil list and per-row reassign dropdown

