

## Add Month Calendar View to Mobile Schedule

### What You'll Get

A new "Month" layout option on the mobile schedule page, togglable alongside the existing "List" view. The month view will show:

1. A full month grid (Mon-Sun) with the month name as a bold header
2. Colored indicator bars/dots under each date showing lesson activity
3. Tapping a date shows that day's events below the grid -- all-day events first, then timed lessons and external calendar events with start/end times
4. A "Today" button to quickly jump back to the current date

The existing list view remains unchanged and fully functional.

### How the Toggle Works

On mobile, two small segmented buttons will appear in the sticky header bar (between the spacer and the sync icon):
- **List** (current week-strip + card layout)
- **Month** (new full-month grid + event list)

The selection persists in localStorage so it's remembered between sessions.

### Month View Layout (matching the reference image style)

```text
+------------------------------------------+
|  < February 2026 >                       |
|  M    T    W    T    F    S    S          |
|       1                                  |
|  2    3    4   [5]   6    7    8          |
|  --   --   --   o   --   --   --         |
|  9   10   11   12   13   14   15         |
|  ...                                     |
+------------------------------------------+
|  Spring term                    all-day  |
|  Lotty : College AM             all-day  |
|  | National Speed Awareness   07:00      |
|  |   us06web.zoom.us          10:00      |
|  | WDU - 5pm - What's Driv... 17:00      |
|  |   us02web.zoom.us          20:00      |
+------------------------------------------+
|  [Today]                                 |
+------------------------------------------+
```

- Today's date gets a circular highlight
- Selected date gets a filled circle (using the existing navy #1a3a4a)
- Colored dots/bars under dates indicate: lessons (amber), external events (teal/calendar color)
- Weekends (Sun) shown in red text, matching iOS convention
- Month navigation via left/right arrows

### Implementation Steps

**Step 1: Create `MobileMonthCalendarView` component**
- New file: `src/components/instructor/MobileMonthCalendarView.tsx`
- Props: `instructorId: string`
- Manages its own selected date and visible month state
- Fetches lesson counts and external events for the entire visible month
- Renders a 7-column grid for the month with event indicators
- Below the grid, renders the selected day's events (all-day first, then timed) in a list format matching the reference -- event title on the left, time on the right, with a left-border accent for timed events
- Includes a "Today" button at the bottom
- Tapping a date selects it and loads that day's events
- Tapping a lesson event opens the same expandable card / actions as the list view
- Reuses existing data fetching patterns from `NewMobileScheduleView` and `ScheduleDayTabs`

**Step 2: Add mobile view toggle to `InstructorSchedule.tsx`**
- In the mobile header section (between the spacer and sync button), add two small toggle buttons: List and Month icons
- Wire the toggle to switch between `NewMobileScheduleView` and `MobileMonthCalendarView`
- Persist choice to localStorage under the existing `instructor-schedule-view` key
- Update the `ViewMode` type to include `'month'` as a valid option

### Technical Details

- **Files created**: `src/components/instructor/MobileMonthCalendarView.tsx`
- **Files modified**: `src/pages/InstructorSchedule.tsx` (add toggle + render new view)
- **No database changes** -- uses existing `scheduled_lessons` and `instructor_calendar_events` tables
- **No new dependencies** -- uses existing `date-fns` for date arithmetic
- **Color scheme**: Matches existing navy (#1a3a4a) for selection, amber dots for lessons, teal for external events, consistent with the current schedule page styling
- **iOS-style aesthetic**: System grey background, rounded-xl cards for events, clean typography matching the portal visual identity

