Update `PupilCoursesList.tsx` so every non-deleted pupil for the in-scope instructor(s) appears in Course Summaries, not just pupils with active scheduled lessons.

### Changes
1. Remove the `.filter((p) => lessonStats.has(p.id))` gate so zero-lesson pupils are included.
2. Keep the `deleted_at IS NULL` filter on `scheduled_lessons` so cancelled/deleted lessons don't inflate counts.
3. For pupils with zero active lessons: render `lesson_count = 0` and `next_lesson_date = null`.
4. Sort: pupils with an upcoming `next_lesson_date` first (ascending), then pupils with zero lessons (alphabetically by name) — so active courses still surface at the top.
5. Update card subtitle from "Pupils with scheduled lessons" to "All pupils".
6. Add a subtle "No upcoming lessons" muted tag on rows with `lesson_count === 0`.

### Out of scope
- No DB/schema changes.
- No RLS changes.
- No change to `PupilCourseSummary` detail page.