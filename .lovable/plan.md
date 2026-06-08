Root cause:
- The schedule’s main Add dialog still blocks lesson dates with `validateNotInPast(...)`, so a past date fails validation before insert.
- The desktop schedule feed starts at today, so past lessons are not loaded/displayed in that schedule view even if they exist.

Plan:
1. Update `AddCalendarEventDialog` so the Lesson tab accepts any valid selected date instead of rejecting dates before today.
2. Keep the past-date restriction for personal blocks/events unless you later want those historical too.
3. Update `MultiDayScheduleView` to load a short historical window before today as well as future days, so recently-added/completed past lessons can appear on the schedule.
4. Keep clash checks, pupil selection, inserts, and existing payment/EOL behaviour unchanged.

Technical notes:
- Replace the lesson-only `validateNotInPast(lessonDate...)` with a required/valid-date check.
- Change the schedule query start date from `startOfDay(new Date())` to a lookback start date while preserving today scrolling and future loading.