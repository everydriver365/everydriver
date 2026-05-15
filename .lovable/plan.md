## Goal
Add a list view toggle to the Drive365 (and shared) course search results, with the existing "Cheapest" sort button available in both grid and list views.

## Background
- `CourseGrid.tsx` currently renders only `DynamicCourseCard` in a 2-column grid. It already shows sort buttons: "Soonest", "Cheapest", "Nearest".
- `EDCourseList.tsx` (EveryDriver-styled list rows) exists but is **unused** anywhere in the app.
- `CourseWithInstructor` does not carry a computed `price` field — price is derived from `instructor.hourly_rate * hours`.

## Changes

### 1. CourseGrid — add view mode toggle
- Add `viewMode` state (`"grid" | "list"`) inside `CourseGrid`, default `"grid"`.
- Add a small view toggle (LayoutGrid / List icons) next to the existing sort buttons.
- When `viewMode === "list"`, map `filteredCourses` to compute `price` from `instructor.hourly_rate * hours` and render `EDCourseList`.
- When `viewMode === "grid"`, keep existing `DynamicCourseCard` grid.

### 2. EDCourseList — accept full CourseWithInstructor shape
- Broaden the `EDCourseList` prop interface so it can accept `CourseWithInstructor[]` directly, computing price internally from `instructor.hourly_rate * hours`.
- Keep the existing navy/amber EveryDriver styling.

### 3. No changes to sort logic
- The existing "Cheapest" sort button in `CourseGrid` already works via `useCourseDiscovery`. It will simply re-sort the same data before it reaches either grid or list rendering.

## Files touched
- `src/components/courses/CourseGrid.tsx` — add view toggle + branch rendering
- `src/components/everydriver/EDCourseList.tsx` — widen props to accept `CourseWithInstructor`, compute price internally

## What the user sees
- Sort bar gains a Grid/List icon toggle.
- Switching to list shows compact horizontal course rows (navy/white EveryDriver styling).
- The "Cheapest" sort button is already present and works for both views.
