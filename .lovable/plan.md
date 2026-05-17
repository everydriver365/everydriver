You’re right: the current safety net is incomplete because `get_public_instructor_lesson_geo` only returns lessons with pickup/dropoff coordinates. Ken D’s 18 June lessons have no coordinates, so they are excluded and cannot block public availability.

Plan:

1. Fix the public lesson-blocking source
- Update the public lesson availability RPC so it returns every active future `scheduled_lessons` row needed to block time, even when coordinates are missing.
- Keep coordinates optional and continue exposing no pupil names, addresses, emails, phones, prices, or notes.
- Existing coordinate rows will still be used for inter-lesson travel padding; coordinate-less rows will still block the lesson time itself.

2. Fix the public course discovery page state
- `src/pages/Courses.tsx` currently drops `bookedLessonGeo` when building `availabilitySources`, so the loaded synthetic lesson blockers are not preserved.
- Add `bookedLessonGeo` state and include it in `availabilitySources` so date dots, course cards, and counts all use the same loaded source data.

3. Align /courses and booking slot picker rules
- Ensure public course search and `LessonScheduler` both use `loadCourseAvailabilitySources` with the complete booked-lesson source.
- Keep travel enforcement only where candidate pickup coordinates are available; otherwise the booking time itself still blocks the slot.

4. Refresh outdated comments/memory
- Replace the misleading “scheduled_lessons are NOT subtracted” comments with the current enforced behaviour: calendar/manual blocks are primary, but active scheduled lessons are injected as public-safe blockers to prevent double-booking if calendar sync is missing.
- Update the memory rule so future work does not reintroduce the coordinate-only gap.

5. Validate Ken D’s 18 June case
- Re-query Ken D after the RPC change to confirm all 8 active scheduled lessons are returned by the public source.
- Verify the day resolves with those lesson times blocked in the public availability path.