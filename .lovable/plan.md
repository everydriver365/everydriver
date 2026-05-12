## Add Week timeline view to Instructor Schedule

### What

Add a third view option on the Schedule tab that matches the uploaded reference: a 7-day week grid with hours running down the left (08:00–19:00), days across the top, and lesson blocks rendered as coloured columns with start/end times and a paid/unpaid status pill at the bottom of each block.

### Where

- `src/pages/InstructorSchedule.tsx` — extend the mobile segmented control from 2 → 3 options, and add the new view to the desktop dropdown.
- New file: `src/components/instructor/WeekTimelineView.tsx` — the new view component.

### Mobile toggle

Change the segmented control to three equal pills:

`List` · `Week` · `Month`

(Renames "Schedule" → "List", "Calendar" → "Month", and inserts the new "Week" view in the middle.) Icons: `List`, `CalendarRange`, `CalendarDays`. Active pill keeps the current white-on-grey styling.

### Desktop dropdown

Add a fourth `Week` item alongside existing List / Schedule / Calendar.

### Week view spec (matches screenshot)

- Sticky top header: Mon–Sun with day name + date number; today's number rendered as a filled blue circle (`#3D55A1`).
- Left gutter: hour labels every 60 min, 08:00 → 19:00 (configurable, auto-extends if lessons fall outside).
- Grid: 7 columns × hour rows, faint `#F0F3F8` gridlines.
- Lesson blocks positioned absolutely by `start_time` + `duration_minutes`, full-column width per day with 2px inner padding.
  - Color: lesson type / calendar colour. Default orange `#F08A2E`, blocks for cancelled or special types use red/green following existing `calendarColors` map.
  - Content: pupil first+last name (2-line clamp), start time bold, end time bold, then a coloured status pill at the bottom: green `Paid` (`#2BB673`) if `balance >= lesson_cost`, pink `Unpaid` (`#E94B7B`) otherwise.
- "Now" line: thin horizontal blue marker on today's column at current time.
- Tap a block → opens existing `CalendarEventSheet` (reuse `setSelectedEvent`).
- Long-press / empty-cell tap → `handleAddEvent(date)`.
- Horizontal swipe / arrow buttons in header → previous/next week (reuse `calendar.navigate`).

### Data

Reuse `useInstructorCalendar(instructorId)` (already loaded in the page). Filter `calendar.events` to the visible week, project lessons into the day columns. No backend changes.

### Persistence

`localStorage` `instructor-schedule-view` already persists view; add `'week'` to the allowed values list.

### Out of scope

- No changes to colour settings, sync logic, or event editing flows.
- Desktop layout of the new view will use the same component (it scales fine to wider widths).
