## Why it is failing

- `/courses` is only checking whether an instructor has a working day row or availability window for the selected date.
- It is not checking whether that date still has any free bookable time after existing lessons and Google Calendar busy events are applied.
- The logic is duplicated in multiple places (`/courses`, EveryDriver `/courses`, mini-sites via `useCourseDiscovery`, and slot-search hooks), so fixes have drifted.
- There is also a day-number mismatch risk: `instructor_working_hours` was created as `0=Sunday..6=Saturday`, while newer `availability_windows` is being treated in some code as `1=Monday..7=Sunday`. That can hide the wrong instructors on certain days.
- In the live 8 June example, Ken has active Monday hours and courses, but he also has synced Google Calendar events on that date. The current course display does not use the slot engine to decide whether he should still show if there is a gap, so the result can be wrong depending on the page/date path.

## Plan

1. Create one shared availability resolver for learner-facing booking/course display.
   - Inputs: instructors, active courses, working hours, availability windows, date overrides, scheduled lessons, manual blocks, Google Calendar events, selected date/range.
   - Output: whether each instructor has at least one genuinely bookable slot and the course count for that date.

2. Normalize all weekly availability sources before filtering.
   - Preserve `instructor_working_hours` as `0=Sunday..6=Saturday`.
   - Preserve `availability_windows` as the newer weekly window source, normalizing it safely so both existing `0..6` and `1..7` rows can be interpreted correctly where possible.
   - Include start/end times, not just `is_active`, because “available that day” must mean there is a real time window.

3. Make `/courses` and EveryDriver `/courses` use the resolver.
   - Load Google Calendar busy events from `instructor_calendar_events` for the displayed horizon.
   - Load existing `scheduled_lessons` and manual blocks for the same horizon.
   - For selected dates, show every instructor who has an active course and at least one free slot after conflicts are applied.
   - Keep postcode/radius as a separate display/filter concern; it must not erase availability correctness.

4. Update mini-site and whitelabel course pages through `useCourseDiscovery`.
   - Reuse the same resolver so instructor-specific course pages and global course search behave the same way.

5. Update bookable slot generation paths.
   - Align `LessonScheduler` and `useInstructorAvailabilitySearch` with the same normalized weekly windows and calendar conflict rules.
   - This prevents a course card showing an instructor but the booking step offering no valid slots unless the calendar really is full.

6. Verify against the reported case.
   - Query/check 8 June for Ken and Richard.
   - Confirm Ken appears on `/courses?postcode=SO225AB` if he has at least one free bookable gap after Google Calendar conflicts.
   - Confirm instructors with no free gap on the selected date do not appear.
   - Confirm no regression for instructors using only `availability_windows` or only legacy `instructor_working_hours`.