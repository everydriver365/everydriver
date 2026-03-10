

## Problem

The ellipsis dropdown menu on the instructor list in `InstructorManager.tsx` still has actions like "View Details", "Edit", "Reassign Pupils", and "Change Plan" that open separate dialogs -- duplicating what's already on the unified profile page. The dropdown should be simplified to direct users to the profile page for most actions.

## Plan

### Simplify the ellipsis dropdown in `InstructorManager.tsx`

**Current dropdown items** (7 items, most redundant with profile page):
- View Details → opens a separate dialog
- Edit → opens InstructorForm dialog
- Reassign Pupils → opens ReassignPupilsDialog
- Change Plan → opens plan dialog
- Deactivate/Activate
- Delete

**New dropdown items** (3 items):
- **View / Edit Profile** → navigates to the unified `AdminInstructorProfile` page (where reassign, change plan, edit, etc. all live)
- **Deactivate / Activate** → quick toggle (kept for convenience)
- **Delete** → destructive action (kept for convenience)

### Remove unused dialogs from `InstructorManager.tsx`

- Remove the "Instructor Details" dialog (`selectedInstructor` state + the large `Dialog` block)
- Remove the `ReassignPupilsDialog` usage (it's already on the profile page)
- Remove the `InstructorForm` edit dialog (editing is inline on the profile page)
- Remove the plan change dialog if it's also on the profile page
- Clean up related state variables (`selectedInstructor`, `reassignInstructor`, `editInstructor`)

### Files to change
- **`src/components/admin/InstructorManager.tsx`** — simplify dropdown to 3 items, remove redundant dialogs and state

