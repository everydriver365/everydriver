

## Problem

The Archive, Delete, Mark Inactive, and Reassign options **do exist** in the code but are hard to find:

1. **Archive & Delete** — small ghost buttons in the dark header bar next to the pupil name. On some screen sizes these may be cut off or hard to spot against the dark background.
2. **Mark Inactive** — hidden inside the edit form. You must click the pencil/edit icon on "Pupil Details", then change the Status dropdown.
3. **Reassign** — also hidden inside the edit form under "Assigned Instructor" dropdown.

## Plan

Make these actions prominently accessible **without** needing to enter edit mode:

### Changes to `src/components/admin/PupilRecordsManager.tsx`

1. **Add an action bar** below the detailed view header (below line 688) — a visible strip with clearly labeled buttons:
   - **Mark Inactive** button (amber) — sets status to "inactive", moves pupil to the inactive section
   - **Archive** button (amber) — existing `archivePupil` logic, with confirmation dialog  
   - **Delete** button (red) — existing `softDeletePupil` logic, with confirmation dialog
   - **Reassign** dropdown/button — a select to pick a new instructor, triggers reassignment

2. **Keep existing edit-mode** status/instructor fields as they are (for detailed editing).

3. **Remove the small header buttons** for Archive/Delete since they'll now live in the more visible action bar.

The action bar will render as a horizontal row of buttons with icons, only shown when a pupil is selected, sitting between the header and the detail content. Each destructive action retains its `AlertDialog` confirmation.

