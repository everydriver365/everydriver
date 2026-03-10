

## Problem

Currently the admin portal has fragmented management for instructors and pupils:

**Instructors**: The `InstructorManager` has a table list with a "View Details" dialog (read-only overview) and a separate "Edit" dialog (the full `InstructorForm`). Actions like deactivate, delete, reassign pupils, and change plan are scattered across a dropdown menu on the table row AND inside the details dialog. There is no single unified profile page.

**Pupils**: The `PupilRecordsManager` already has a fairly comprehensive split-panel layout (instructor list on left, pupil detail on right) with inline editing, action bar, lesson history, payments, and test results. This is closer to what you want but lives in a separate section from instructors.

## Plan

### 1. Create a unified Admin Instructor Profile page

**New file: `src/components/admin/AdminInstructorProfile.tsx`**

A full-page profile view for a single instructor that consolidates everything into one editable page:

- **Header section**: Avatar, name, status badge, plan badge, quick stats (pupils, rate, coverage)
- **Action bar**: Edit details, Deactivate/Activate, Delete, Reassign Pupils, Change Plan -- all in one row
- **Editable details section**: Inline-editable fields (name, email, phone, postcode, car details, bio, rate, radius, etc.) using the existing `InlineEditField` component -- no separate edit dialog needed
- **Sub-sections** (collapsible):
  - Subscription & Plan management
  - Vehicle details
  - Website link / slug
  - Working hours (if applicable)
  - Social links & branding

Clicking an instructor name in `InstructorManager` will navigate to this profile page instead of opening a dialog.

### 2. Enhance the Admin Pupil Profile

The existing `PupilRecordsManager` detail panel is already close. Changes:

- Make it accessible directly when clicking a pupil from any list (instructor profile page will have a "View Pupils" section linking into the pupil records)
- Ensure all actions (edit, delete, reassign, mark inactive, archive, reactivate) remain consolidated in the action bar as they already are

### 3. Wire up navigation

**`src/components/admin/InstructorManager.tsx`**:
- Clicking an instructor name navigates to the new profile page (via `activeSection` state with instructor ID) instead of opening a dialog
- Remove the separate "View Details" dialog and "Edit" dialog -- replaced by the unified profile
- Keep the table row dropdown for quick actions (deactivate, delete) but "View/Edit" opens the profile

**`src/pages/AdminPortal.tsx`**:
- Add a new `case "instructor-profile"` that renders `AdminInstructorProfile` with the selected instructor ID
- Add navigation handler to pass instructor ID to the profile view

### Files to change:
- **Create**: `src/components/admin/AdminInstructorProfile.tsx` -- unified instructor profile page
- **Edit**: `src/components/admin/InstructorManager.tsx` -- remove details/edit dialogs, link to profile page
- **Edit**: `src/pages/AdminPortal.tsx` -- add instructor-profile section routing

