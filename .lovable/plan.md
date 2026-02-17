
# Admin-Only Tracker Assignment

## Summary
Move all GPS tracker search/link/unlink functionality out of the instructor-facing pages and into a new "Trackers" section in the admin panel. Instructors will no longer be able to discover or assign Quartix units themselves.

## Changes

### 1. Remove `QuartixIdSearch` from Instructor Pages

**`src/pages/InstructorSettings.tsx`**
- Remove the `import { QuartixIdSearch }` line
- Remove the `<QuartixIdSearch instructorId={instructorId} />` usage (around line 1065)

**`src/pages/InstructorGPSSetup.tsx`**
- Remove the `import { QuartixIdSearch }` line
- Remove `<QuartixIdSearch instructorId={instructor?.id} />` (around line 368)

### 2. Create Admin Trackers Manager Component

**New file: `src/components/admin/AdminTrackersManager.tsx`**

This component will provide the full tracker management UI for admins:
- A dropdown/select to pick an instructor
- Once selected, show the Quartix server vehicle list (reusing the `quartix-vehicles` edge function)
- Link/unlink units to the selected instructor
- Assign units to the instructor's vehicles
- Set active/inactive status
- Show a summary table of all currently assigned trackers across all instructors

### 3. Register the "Trackers" Section in Admin Portal

**`src/pages/AdminPortal.tsx`**
- Add `"trackers"` to `sectionMeta` with title "GPS Trackers", group "System Settings", icon `Satellite`
- Add a `case "trackers"` in the `renderContent` switch to render `<AdminTrackersManager />`

**`src/components/admin/AdminLayout.tsx`**
- Add `"trackers"` to `sectionToTab` mapping (map it to the "instructors" tab or add as its own top-level tab)
- Alternatively, make it accessible from the Settings grid rather than a top-level tab (to avoid adding yet another tab to the header)

### 4. Wire into Admin Settings Grid

**`src/components/admin/AdminSettingsGrid.tsx`** (or equivalent overview grid)
- Add a "GPS Trackers" tile so admins can navigate to the trackers section from the overview

## Technical Details

### AdminTrackersManager Component Structure

```text
+------------------------------------------+
| GPS Tracker Management                    |
+------------------------------------------+
| [Select Instructor v]                     |
+------------------------------------------+
| All Assigned Trackers (table view)        |
| Instructor | Device | Vehicle | Status   |
| ...        | ...    | ...     | Active   |
+------------------------------------------+
| Quartix Server Units (when instructor    |
| selected)                                 |
| [Search box] [Refresh]                   |
| Unit list with Link/Unlink/Set Active    |
+------------------------------------------+
```

The component will:
- Fetch all instructors for the dropdown
- Fetch all `gps_devices` rows to show a global overview table
- When an instructor is selected, call the `quartix-vehicles` edge function and show linkable units
- Reuse the same linking/unlinking/set-active logic currently in `QuartixIdSearch`, but scoped to the admin-selected instructor
- Include the instructor's vehicles for assignment (fetched from `instructor_vehicles`)

### Files Summary

| File | Action |
|------|--------|
| `src/pages/InstructorSettings.tsx` | Remove QuartixIdSearch usage |
| `src/pages/InstructorGPSSetup.tsx` | Remove QuartixIdSearch usage |
| `src/components/admin/AdminTrackersManager.tsx` | New - admin tracker management UI |
| `src/pages/AdminPortal.tsx` | Add trackers section metadata + render case |
| `src/components/admin/AdminLayout.tsx` | Add trackers to sectionToTab mapping |
