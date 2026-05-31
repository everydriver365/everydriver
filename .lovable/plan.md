## Goal
Make "Course Summaries" appear in the **Critical** section at the top of the instructor desktop sidebar, and ensure it's also reachable from the regular nav so the picker can find it.

## Changes

**File:** `src/components/instructor/dashboardV2/DashboardSidebar.tsx`

1. Add a nav entry in the "My Courses" group so the item exists in the sidebar's master list:
   ```
   { label: "Course Summaries", to: "/instructor/course-summaries", icon: ClipboardList }
   ```
   (Import `ClipboardList` from `lucide-react`.)

2. Add `/instructor/course-summaries` to the `DEFAULT_CRITICAL` array so new instructors see it pinned at the top.

3. For existing instructors (who already have a persisted `sidebar_critical`), add a one-time merge: on load, if `sidebar_critical` exists but does **not** include `/instructor/course-summaries`, append it and persist back to `instructors.sidebar_critical` + localStorage. This guarantees the link shows in Critical for everyone, not just new accounts, without wiping their custom order.

## Out of scope
- No mobile sidebar changes (per mobile-update policy).
- No changes to the route itself — `/instructor/course-summaries` already exists and renders `InstructorCourseSummariesPage`.
