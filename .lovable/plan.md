## Plan

Fix the course search results so mock/network instructor cards appear for areas like `WD17` when there are no real instructor courses in range.

### What I’ll change

1. Update the active `/courses` page filtering logic to recognise postcode districts like `WD17`.
2. Include `is_network_placeholder` instructors by matching `placeholder_district` to the searched postcode district.
3. Treat placeholder instructors as enquiry-only and available on future dates, instead of requiring working-hours/calendar availability.
4. Only show placeholder courses as fallback results when no real instructor courses are available for the searched area.
5. Keep real instructor results, radius filtering, sorting, and existing cards unchanged.

### Files involved

- `src/pages/Courses.tsx`

### Why this is needed

The reusable `useCourseDiscovery` hook already supports placeholder instructors, but the active `/courses` page has its own older search/result logic that only uses real geocoded instructors and availability. The database does contain WD17 placeholder instructors, but the page currently filters them out before rendering.