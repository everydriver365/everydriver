Suzanna's "lesson on 27 June" is a `cancelled` row (`status='cancelled'`, `deleted_at` null). The current query in `PupilCoursesList.tsx` only filters by `deleted_at IS NULL`, so cancelled lessons still inflate `lesson_count` and feed `next_lesson_date`.

### Change
In `src/components/courses/PupilCoursesList.tsx`, narrow the `scheduled_lessons` query so cancelled/no-show rows are excluded:

- Add `.not("status", "in", "(cancelled,no_show,no-show)")` alongside the existing `.is("deleted_at", null)` filter.
- Also pull `status` into the select for safety and skip any row whose status indicates it's not an active lesson.

Result: Susanna shows 0 active lessons → "No upcoming lessons" tag, no fake "next 27/06/26".

### Out of scope
- No DB changes, no schema changes.
- No change to the detail page (`PupilCourseSummary`) — that's a separate review if you also see ghost rows there.