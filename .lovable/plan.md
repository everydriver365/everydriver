I found the mismatch. The public search and the booking calendar are not using the same definition of “available”.

What is happening:
- Ken’s working window is real: 10:30–16:00.
- The search page currently marks dates/courses available using a broad day-level check.
- The booking calendar then applies stricter slot rules: Ken only allows 2h/3h lessons, plus his buffer/travel padding, plus scheduled lessons and calendar blocks.
- On 2 June specifically, Ken already has multiple scheduled lessons around 10:30/11:00 in the database, so the booking calendar correctly has no bookable 2h slot.
- The booking page also ignores the `date=` passed from the course card, so it can open on a month/date that doesn’t match the advertised date.

Plan to fix it properly:

1. Make course search use exact bookable-slot logic
   - Update the learner-facing course availability resolver so a course date only counts if the instructor has at least one real slot for the lesson lengths they allow.
   - For Ken, that means 2h/3h availability, not just “at least 60 minutes free”.
   - Keep existing conflict sources: scheduled lessons, manual blocks, Google Calendar busy events, buffers, and all-day informational-event filtering.

2. Make each course card validate the actual course/date pair
   - Filter `coursesForSelectedDate` so a 10h/20h/30h course is only shown on dates where the first bookable lesson can actually be selected.
   - Course counts in the sidebar calendar will use the same exact logic, so dates won’t show misleading course counts.

3. Make the booking calendar honour the selected date from search
   - Pass the `?date=yyyy-mm-dd` value from `BookingSummary` into `MobileBookingView` and then into `LessonScheduler`.
   - `LessonScheduler` will open on that month and preselect that date if it still has slots.
   - If that date has become unavailable, it will automatically jump to the next genuinely bookable date.

4. Remove the weak “first working day” jump
   - Replace the current `isDateAvailableCheck` month-jump logic, which only checks working hours, with the exact slot availability check.
   - This prevents the calendar opening on June just because working hours exist when no valid pupil slot exists.

5. Add a clear no-slots state
   - If a date is selected but has no valid slots, show a clear message and a “Next available date” action instead of leaving the learner staring at a blank/disabled calendar.

6. Verify against Ken
   - Check that June dates with no 2h/3h slots no longer appear as bookable for Ken.
   - Check that the course card date and booking calendar date match.
   - Check that July dates with genuine free 2h/3h slots show selectable times.