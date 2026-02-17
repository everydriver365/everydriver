

## Add "Your Plan" and "Sign Out" to the Bottom of the Desktop Sidebar

### What Changes

The left-hand sidebar on the instructor dashboard (desktop view) currently shows navigation groups and a small user info + logout section at the bottom. This plan adds a **"Your Plan"** tile above the existing sign out area, styled to fit the sidebar's compact layout.

### Implementation Details

**File: `src/components/layout/InstructorPortalLayout.tsx`**

1. Import the `PlanBadge` component (already imported) and the `useInstructorAuth` context (already available via `instructor` and `subscription`).
2. Import `planIcon` from `@/assets/plan-icon.png`.
3. In the desktop sidebar bottom section (lines 928-959), add a "Your Plan" button/link above the existing user info:
   - When sidebar is expanded: Show a compact card with plan icon, "Your Plan" label, and the `PlanBadge` showing the current plan. Clicking navigates to `/instructor/plans`.
   - When sidebar is collapsed: Show just the plan icon as a small button that navigates to `/instructor/plans`.
4. Keep the existing sign out button below, unchanged.

### Technical Details

The bottom `<div className="border-t p-2">` section will be restructured to:

```
border-t section:
  [Your Plan button/link -> navigates to /instructor/plans]
  [separator]
  [Existing user info + sign out]
```

The Plan button will use the same styling patterns as the sidebar nav links (compact, with icon + text when expanded, icon-only when collapsed). The `PlanBadge` component will show the current plan tier (Free, Pro, etc.) as a small badge.

No new components are needed -- this reuses `PlanBadge` and `planIcon` already in the codebase.

