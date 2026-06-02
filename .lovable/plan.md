The course grid broke again because the previous fix still fetched courses for all loaded instructors, and the live data now shows:

- 5,800 active public instructors
- 5,796 of those are network placeholders
- 26,102 active instructor courses
- 26,082 of those courses belong to placeholders

So `/courses` is still pulling almost the entire placeholder course set before it can render. That keeps the page overloaded and can leave the course cards empty.

Plan:

1. Update `src/pages/Courses.tsx` only.
2. Change the course loading strategy so normal page load fetches courses for real instructors only.
3. Add placeholder course loading only when a postcode/district search actually needs placeholders for that district.
4. Keep existing booking, availability, search, filters, sorting, and card UI unchanged.
5. Preserve the fallback behaviour: placeholders show only when no real courses are visible for the searched district.

Technical detail:

- The bug is at the latest fix area around the `instructorIds` course fetch.
- It should not use all `loadedInstructors` for `instructor_courses`.
- It should use `realInstructorIds` for the initial course fetch.
- Placeholder courses should be fetched lazily/scoped by searched district rather than loaded globally.

This is a frontend data-loading fix only; no database changes are needed.