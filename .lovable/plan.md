## Use the same shell on every desktop instructor page

Most desktop instructor pages render inside `DashboardShell` (DSM sidebar + topbar). Two pages still use the older `InstructorPortalLayout`, which has a different sidebar and chrome — that's why navigating to `/instructor/diary` looks different.

Switch both outliers to `DashboardShell` so the sidebar, topbar, padding and tokens match the rest.

### Files to change

**`src/pages/instructor/InstructorFindAppointmentPage.tsx`**
- Replace `InstructorPortalLayout` with `DashboardShell`.
- Wire `useInstructorAuth` + `useCombinedNotificationCount` like `InstructorScheduleDesktop` does (initials, signOut, bell → `/instructor/notifications`, AskED dispatch).
- Drop the bespoke wrapper (`p-3 md:p-4 h-[calc(100vh-4rem)]` + `rounded-[24px]`) and just constrain the body width (`max-w-3xl mx-auto`); `DashboardShell` already handles the page padding.

**`src/pages/InstructorDiary.tsx`**
- Replace both `InstructorPortalLayout` wrappers (loading + main render) with `DashboardShell`.
- Add the same auth + notification hooks and `handleSignOut` helper.
- Remove the page-level `-mx-4 -my-4 sm:-mx-6 sm:-my-6` overrides — `DashboardShell` already supplies `padding: 24` so the content sits correctly.
- Keep all data fetching, filters, search, voice search, stats and lesson list logic untouched.

### Out of scope
- Mobile (per project rule). Both pages already render within their existing mobile flows; the change is desktop-only because `DashboardShell` is a desktop-first shell — the existing `useIsMobile`/route-level mobile branches keep handling mobile.
- Any other page (the rest of the desktop instructor pages already use `DashboardShell`).
- Business logic, RLS, queries.

### Result
Clicking "Diary" or "Find appointment" keeps the same DSM sidebar, top bar, page background and indigo accent as Schedule, Pupils, Payments, Reports, etc.