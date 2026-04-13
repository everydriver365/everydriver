

## Plan: Apply All 5 Portal Management Steps

### Overview
Implement a unified portal architecture across all five user roles: Admin, Instructor, Pupil, Parent, and School Manager. This involves creating a shared layout system, elevating School and Parent portals, adding role-based routing, and standardizing mobile navigation.

---

### Step 1: Create Shared `PortalShell` Component

**New file: `src/components/layout/PortalShell.tsx`**
- A configurable layout component that accepts:
  - `sidebarGroups` — navigation items grouped by section
  - `headerBranding` — logo, title, colors
  - `onLogout` — logout handler
  - `activeSection` / `onSectionChange` — for sidebar-based portals
  - `mobileNavItems` — bottom nav config for mobile-first portals
  - `variant` — `"sidebar"` (Admin/School/Instructor desktop) or `"mobile"` (Pupil/Parent)
- Desktop: renders collapsible sidebar (using existing Shadcn Sidebar components) + header + breadcrumb
- Mobile: renders hamburger sheet menu (sidebar portals) or bottom nav (mobile portals)
- Replaces duplicated patterns from `AdminLayout.tsx`, instructor layouts, etc.

### Step 2: Elevate School Manager to First-Class Portal

**New files:**
- `src/context/SchoolAuthContext.tsx` — auth context checking `user_roles` for `school_manager` role
- `src/components/auth/ProtectedSchoolRoute.tsx` — guards `/school/*` routes
- `src/components/school/SchoolLayout.tsx` — uses `PortalShell` with sidebar variant; sections: Dashboard, Instructors, Bookings, Branding, Finances
- `src/routes/schoolRoutes.tsx` — dedicated route module with sub-pages:
  - `/school/login` — school manager login
  - `/school/dashboard` — overview (refactored from existing `SchoolDashboard.tsx`)
  - `/school/instructors` — instructor management
  - `/school/bookings` — bookings overview
  - `/school/branding` — white-label/branding settings
  - `/school/finances` — financial summary

**Modified files:**
- `src/routes/instructorPortalRoutes.tsx` — remove `/school/dashboard` route
- `src/App.tsx` — import and add `schoolRoutes`
- Add `school_manager` to `app_role` enum via migration (if not already present)

### Step 3: Elevate Parent Portal to Own Route Module

**New files:**
- `src/routes/parentRoutes.tsx` — dedicated route module:
  - `/parent` — main portal (existing `ParentPortal.tsx`)
  - `/parent/install` — PWA install (move from publicRoutes)
  - `/parent/messages` — messaging sub-page
  - `/parent/payments` — payment history sub-page
- `src/components/layout/ParentLayout.tsx` — uses `PortalShell` with mobile variant, wraps parent pages with consistent header + bottom nav

**Modified files:**
- `src/routes/publicRoutes.tsx` — remove `/parent` and `/parent/install` routes
- `src/App.tsx` — import and add `parentRoutes`

### Step 4: Role-Based Auto-Redirect After Login

**New file: `src/components/auth/RoleRedirect.tsx`**
- On login, queries `user_roles` for the authenticated user
- Single role → redirect to the correct portal (`/admin`, `/instructor`, `/school/dashboard`, `/parent`, `/pupil`)
- Multiple roles → show a simple role-picker card UI ("Continue as Admin / Instructor / School Manager")
- Used after successful login on shared or ambiguous login pages

**Modified files:**
- `src/context/AdminAuthContext.tsx` — minor: expose role list (not just `isAdmin`)
- Login pages can optionally redirect through `RoleRedirect` component

### Step 5: Unify Mobile Navigation Patterns

**New file: `src/components/layout/MobilePortalNav.tsx`**
- Shared bottom navigation component accepting configurable tabs
- Props: `items: { label, icon, path }[]`, `activeColor`, `inactiveColor`
- Replaces duplicated bottom nav logic in `ParentBottomNav`, `EveryInstructorBottomNav`, `MobileBottomNav`

**Modified files:**
- `src/components/parent/ParentBottomNav.tsx` — refactor to use `MobilePortalNav`
- `src/components/instructor/EveryInstructorBottomNav.tsx` — refactor to use `MobilePortalNav`
- `src/components/layout/MobileBottomNav.tsx` — refactor to use `MobilePortalNav`

### Step 6: Refactor AdminLayout to Use PortalShell

**Modified files:**
- `src/components/admin/AdminLayout.tsx` — refactor to wrap `PortalShell` with sidebar variant, passing existing nav groups and branding config. This validates the shared component works before rolling it out further.

---

### Database Migration
- Add `school_manager` to `app_role` enum if not present
- No other schema changes needed

### File Summary

| Action | File |
|--------|------|
| Create | `src/components/layout/PortalShell.tsx` |
| Create | `src/components/layout/MobilePortalNav.tsx` |
| Create | `src/context/SchoolAuthContext.tsx` |
| Create | `src/components/auth/ProtectedSchoolRoute.tsx` |
| Create | `src/components/school/SchoolLayout.tsx` |
| Create | `src/routes/schoolRoutes.tsx` |
| Create | `src/routes/parentRoutes.tsx` |
| Create | `src/components/layout/ParentLayout.tsx` |
| Create | `src/components/auth/RoleRedirect.tsx` |
| Modify | `src/App.tsx` |
| Modify | `src/routes/publicRoutes.tsx` |
| Modify | `src/routes/instructorPortalRoutes.tsx` |
| Modify | `src/components/admin/AdminLayout.tsx` |
| Modify | `src/components/parent/ParentBottomNav.tsx` |
| Modify | `src/components/instructor/EveryInstructorBottomNav.tsx` |
| Modify | `src/components/layout/MobileBottomNav.tsx` |
| Migration | Add `school_manager` to `app_role` enum |

