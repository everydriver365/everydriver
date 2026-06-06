## Scope

The homepage's Featured Courses section uses `IOSCourseCard` (rendered from `src/pages/Index.tsx`). Two changes:

### 1. Remove hourly rate

In `src/components/IOSCourseCard.tsx`, remove the "· from £{hourlyRate}/hr" text shown next to the total price on the front of the card (lines ~210-212).

### 2. Live ratings with "No reviews yet" fallback

The back of the card currently shows a hardcoded `4.9 rating` next to the instructor name.

- Use the existing `useInstructorRating(instructor.id)` hook from `src/hooks/useInstructorRating.ts` (already wired to the `instructor_rating_summary` view).
- If `data.totalReviews > 0` and `data.avgRating != null`: show `★ {avgRating.toFixed(1)} ({totalReviews})`.
- Otherwise: show `No reviews yet` (no star icon).
- While loading: show nothing (or a subtle placeholder) to avoid flashing the fallback.

### Out of scope

- Other course card variants (`CourseCard.tsx`, `DynamicCourseCard`, mini-website cards) are not used on the homepage and stay untouched.
- The featured-instructors section (`FeaturedInstructors.tsx`) is a separate widget and not part of this request.
