
# Add Dashcam Video Viewing and Playback

## Overview
Bring the existing dashcam gallery (currently a standalone page at `/instructor/dashcam`) into three locations as an embedded component:
1. **Instructor Fleet Dashboard** -- new "Dashcam" tab
2. **Instructor Geotab Hub** -- replace the placeholder "coming soon" dashcam tab
3. **Admin Geotab Fleet** -- replace the placeholder "coming soon" dashcam tab with fleet-wide view

## What the user will see
- A new **Dashcam tab** on the Fleet Dashboard with the full gallery: thumbnail grid, search, incident/video/image filters, click-to-preview dialog with metadata, map location, and download button.
- The **Geotab Hub dashcam tab** will show the same gallery inline instead of a "go to dashcam" redirect button.
- The **Admin portal Geotab Fleet dashcam tab** will show all dashcam media across all instructors with an instructor filter dropdown (same pattern as the trips tab).

## Technical details

### 1. Create reusable `DashcamGalleryView` component
**New file: `src/components/instructor/dashcam/DashcamGalleryView.tsx`**

Extract the core gallery logic from `src/pages/instructor/DashcamGallery.tsx` into a reusable component that accepts an `instructorId` prop (or no prop for admin fleet-wide view). Includes:
- Thumbnail grid with play overlay
- Search, incident filter, type filter
- Detail dialog with preview, metadata, map, and download
- Accepts optional `showAllInstructors` boolean for admin mode

### 2. Update `DashcamGallery.tsx` page
**File: `src/pages/instructor/DashcamGallery.tsx`**

Simplify to wrap `InstructorPortalLayout` around the new `DashcamGalleryView` component, passing the instructor's ID.

### 3. Add Dashcam tab to Fleet Dashboard
**File: `src/pages/InstructorFleetDashboard.tsx`**

- Import `Camera` icon and `DashcamGalleryView`
- Add a 10th tab "Dashcam" with the Camera icon
- Update grid-cols from 9 to 10
- Render `DashcamGalleryView` with the instructor's ID in the tab content

### 4. Replace Geotab Hub dashcam placeholder
**File: `src/pages/InstructorGeotabHub.tsx`**

- Import `DashcamGalleryView`
- Replace the placeholder Card with `<DashcamGalleryView instructorId={instructor.id} />`

### 5. Replace Admin Geotab Fleet dashcam placeholder
**File: `src/components/admin/AdminGeotabFleet.tsx`**

- Import `DashcamGalleryView`
- Replace the "coming soon" placeholder with `DashcamGalleryView` in admin mode
- Add an instructor filter dropdown (reusing the existing `instructors` state and `Select` pattern from the trips tab)
- When "All Instructors" is selected, fetch all media; otherwise filter by selected instructor

No database or edge function changes are needed -- the existing `dashcam_media` table, RLS policies, and `geotab-media-download` function already support both instructor and admin access.
