

## Problem

The `ScheduleDayTabs` component only queries `scheduled_lessons` for the dot indicators. It does **not** query `instructor_calendar_events` (Google Calendar events) or `instructor_manual_blocks`. So dots only appear for lessons, not for synced Google Calendar events.

## Fix

Update the `fetchEventDots` function in `ScheduleDayTabs.tsx` to also query `instructor_calendar_events` for the visible week. For each external event, extract the date from `start_time` and add it to the dot counts.

### Changes to `src/components/instructor/ScheduleDayTabs.tsx`:

1. **Add a second query** inside `fetchEventDots` to fetch `instructor_calendar_events` where `start_time` falls within the week range.
2. **Extract dates** from the ISO `start_time` strings and merge counts into the same `counts` record.
3. Optionally also query `instructor_manual_blocks` for completeness.

This ensures dots appear under any date that has lessons, Google Calendar events, or manual blocks.

