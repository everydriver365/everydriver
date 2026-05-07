# Fix: "No courses" on drive365.co.uk postcode search

## Problem
On live `drive365.co.uk/courses?postcode=SO30+2TJ`, the page shows the empty "Select a date" state even though Ken D has 5 active courses. The data is fine — the bug is in `Courses.tsx` auto-search logic.

When `?postcode=` triggers `handleSearch`, it calls `findFirstAvailableDate(instructorsNearby, ...)`. `instructorsNearby` is filtered by a 10-mile radius. If the geocoded lat/lng for `SO30 2TJ` falls just outside any instructor, the array is empty, `selectedDate` becomes `null`, and the grid blanks — even though plenty of courses exist on nearby dates.

The Whitelabel page works because it skips the radius filter.

## Fix (Courses.tsx only)

1. **Fallback in `handleSearch`**: if `findFirstAvailableDate(instructorsNearby, ...)` returns `null`, retry with the unfiltered `instructors` list before clearing `selectedDate`. This keeps the calendar populated.
2. **Auto-expand radius once**: if nearby is empty and `radius < 25`, bump radius to 25 mi automatically (matches existing UX elsewhere).
3. **Soft inline notice**: when fallback kicks in, show a small banner above the grid: "No instructors within X mi of {postcode} — showing nearby results" with an "Expand radius" button.
4. **Diagnostic**: add a `console.warn` when postcode auto-search yields zero nearby instructors, to make this easier to spot in future.
5. **Republish** so live `drive365.co.uk` picks up both this fix and the prior `available_from` fix.

## Files
- `src/pages/Courses.tsx` (only)

No DB migrations, no changes to `WhitelabelCourses.tsx`, `useCourseDiscovery.ts`, or routing.
