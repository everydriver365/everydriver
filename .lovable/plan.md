

## Analysis: Are Available Slots Based on Live Google Calendar Data?

### Current State

**Yes for public booking, No for two other places.**

| Component | Checks Google Calendar? | Status |
|-----------|------------------------|--------|
| `LessonScheduler.tsx` (public booking page) | Yes — queries `instructor_calendar_events` | Correct |
| `useRealGapSlots.ts` (instructor gap-fill dashboard) | Yes — queries `instructor_calendar_events` | Correct |
| `PupilPortalGaps.tsx` (pupil portal "Book a Slot") | **No** — only checks working hours + scheduled lessons | **Missing** |
| `StepBookNext.tsx` (end-lesson "Book Next") | **No** — only checks scheduled lessons | **Missing** |

The Google Calendar data is stored in the `instructor_calendar_events` table and refreshed every 15 minutes by the cron job. So the data is "live" within a 15-minute window. The public booking page correctly cross-references this table.

However, two components skip Google Calendar data entirely, which means they could suggest/book slots that conflict with Google Calendar events (e.g., speed awareness courses, personal appointments).

### Plan

1. **Fix `PupilPortalGaps.tsx`** — Add a query to `instructor_calendar_events` for the 14-day window, then filter out slots that overlap with busy calendar events (ignoring all-day events per existing convention)

2. **Fix `StepBookNext.tsx`** — Add a query to `instructor_calendar_events` for the 7-day lookahead window, then exclude candidate times that conflict with busy calendar events (ignoring all-day events)

3. Both fixes follow the same pattern already used in `useRealGapSlots.ts` and `LessonScheduler.tsx`: fetch events, parse start/end times, check overlap with candidate slots

### Technical Detail

For both components, after fetching `scheduled_lessons`, also fetch:
```sql
SELECT start_time, end_time FROM instructor_calendar_events
WHERE instructor_id = ? AND is_busy = true
  AND start_time <= end_of_range AND end_time >= start_of_range
```

Then filter out all-day events (span >= 24 hours) and check time overlaps against candidate slots, same as the existing pattern.

