## Goal

Add a single top-level "Instructor Overview" entry to the Admin desktop sidebar. Clicking it opens the existing Instructors list section (the new `/admin/instructors/:id` page is then reachable per-instructor from there). Instructor desktop sidebar is intentionally left unchanged (admin-only feature).

## Files to edit

**`src/components/admin/AdminLayout.tsx`**
- Add a new top-level group at the top of `sidebarGroups` (between Dashboard and Communications, or as the very first item — placing it directly under Dashboard works best):
  ```ts
  {
    label: "Instructor Overview",
    icon: Users,
    items: [
      { key: "instructors", label: "Instructor Overview", icon: Users },
    ],
  }
  ```
  This switches the admin portal's `activeSection` to `"instructors"`, which already renders the instructors list (existing behaviour — no logic change).

That's the only change. No new routes, no edits to `AdminPortal.tsx`, no changes to instructor sidebar, no changes to the new detail page, no mobile changes.

## Out of scope

- Auto-linking instructor list rows to `/admin/instructors/:id` (user picked "Open instructors list" only).
- Adding the link to the Instructor desktop sidebar (user picked "Skip — admin only").
- Mobile nav.
