## Why mobile didn't change

The previous edit updated `src/components/courses/CourseGrid.tsx`, but the page you're viewing (`/courses`, rendered by `src/pages/Courses.tsx`) does **not** use that shared component — it renders its own mobile/desktop branches inline and still calls `MobileCourseCard`. Two other pages do the same.

## Files to update

1. **`src/pages/Courses.tsx`** (lines ~1235–1274)
   - Replace the `<MobileCourseCard …>` mobile branch with the same `<DynamicCourseCard …>` used in the desktop branch.
   - Wrap each in a `motion.div` (single column `flex flex-col gap-4`).
   - Keep the existing `mobileVisibleCount` + "Load More" button.
   - Remove `MobileCourseCard` import.

2. **`src/pages/WhitelabelCourses.tsx`** (line ~200)
   - Same swap: mobile branch uses `DynamicCourseCard` instead of `MobileCourseCard`.
   - Remove `MobileCourseCard` import.

3. **`src/pages/mini-website/MiniWebsiteCourses.tsx`** (line ~448)
   - Same swap to `DynamicCourseCard` on mobile.
   - Remove `MobileCourseCard` import.

## Out of scope
- `src/pages/Index.tsx` Featured Courses section (uses `IOSCourseCard`, intentional homepage style — leave alone).
- `MobileCourseCard.tsx` file is left in place in case it's referenced elsewhere; not deleted.

## Result
Mobile course cards on `/courses`, white-label course pages, and mini-website course pages will become the same flip-style `DynamicCourseCard` already used on desktop, in a single-column layout with the existing Load More behaviour.