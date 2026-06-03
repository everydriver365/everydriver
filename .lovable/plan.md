# Add Drive365 course search UI to Chapman's booking page

Replace the current simple Courses grid on `/booking/chapmans` with the full Drive365 course explorer experience — postcode + radius search, course-type filter pills, More Filters panel, sidebar month calendar with availability counts, and the list/grid view toggle — all scoped to Chapman's linked instructors only.

## What gets added (above the existing Instructors grid)

1. **CourseSearchHeader** — title "Chapman's Courses", postcode autocomplete, radius selector, transmission dropdown, course-type pills (All / Intensive / Semi-intensive / Weekly), More Filters toggle.
2. **Expanded filter panel** (toggled by More Filters) — Transmission, Price Range, Course Type, Klarna/Clearpay Pay-Later pills.
3. **Sidebar refinement panel** (desktop) — Lesson times (Anytime / Daytime / Evenings & weekends), Instructor skills chips, Languages chips.
4. **SidebarCalendar** — month-by-month date selector with green-dot availability counts; selecting a date filters courses to that day.
5. **List/Grid view toggle** — same component as the Drive365 results page.
6. **Result grid** — `DynamicCourseCard` rendered with the same props used on `/courses` and `WhitelabelCourses`.

The existing **"Our Instructors"** grid stays untouched and renders below the courses section.

## Approach

Refactor the explorer block in `src/pages/Courses.tsx` (lines ~1170–1900: header, filter panel, sidebar, calendar, course grid, view toggle, all related state/hooks/memos) into a single reusable component:

```text
src/components/courses/CourseExplorer.tsx
  props:
    title?: string
    restrictToInstructorIds?: string[]   // NEW — when set, hook & UI scope to these instructors only
    defaultPostcode?: string
    // existing URL-param syncing remains, but is no-op when embedded
```

`Courses.tsx` will become a thin wrapper that renders `<CourseExplorer />` with no restriction (preserving current behaviour).

`PublicBookingPortal.tsx` will render `<CourseExplorer restrictToInstructorIds={chapmanInstructorIds} title="Chapman's Courses" />` above the existing Instructors section, and drop the standalone `DynamicCourseCard` mapping added earlier.

## Scope guards

- Only `page_type === "group"` booking pages get the explorer; `instructor` / `school` pages unchanged.
- Postcode + radius search is fully active — narrows Chapman's instructors by pupil location, same behaviour as Drive365.
- Mobile layout: matches Drive365 course page exactly (no custom mobile changes).
- No DB changes, no new routes, no edge-function work.
- `useCourseDiscovery` already supports `instructorIds`; we pass Chapman's set when restricted.

## Files

- **New:** `src/components/courses/CourseExplorer.tsx` — extracted from `Courses.tsx`.
- **Edited:** `src/pages/Courses.tsx` — replaces inline JSX/state with `<CourseExplorer />`.
- **Edited:** `src/pages/PublicBookingPortal.tsx` — removes standalone courses block, renders `<CourseExplorer restrictToInstructorIds={…} />`.

## Risks

- `Courses.tsx` extraction is a large refactor of a 2,000-line file. To de-risk, the extraction is **purely mechanical** (move code as-is, add one optional prop for `restrictToInstructorIds`) — no behaviour changes on `/courses`. We'll verify `/courses` still renders correctly after the move before considering it done.
