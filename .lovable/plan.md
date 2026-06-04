## Goal
Bring the calendar date picker back on `/booking/chapmans` mobile so users can pick a date again (currently they see the "Select a date" placeholder with no calendar to interact with).

## Change
In `src/pages/Courses.tsx`, the left column containing `SidebarCalendar` is currently gated behind `!isChapmansMobile`, which hides it entirely on Chapman's mobile.

1. Render `SidebarCalendar` on Chapman's mobile by removing the `!isChapmansMobile` guard around the calendar block (around lines 1387–1401). Keep the desktop "Refine results" panel hidden on mobile (it already uses `hidden lg:block`).
2. Wrap the calendar in a small mobile-only padding container (`px-4` on mobile, none on desktop) so it sits cleanly inside the existing `w-full px-0` Chapman's section.
3. No changes to selection logic, available dates, or the results pane. Once a date is picked, the existing `ChapmansMobileResults` flow renders as today.

No business logic, data, pricing, or desktop layout changes.
