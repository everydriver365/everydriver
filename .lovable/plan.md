

## Import Google Calendar Event Colors

### Problem
The `fetchExternalEvents` action in the `google-calendar-service` edge function fetches events from Google Calendar but ignores the `colorId` field from the API response. The `color` column in `instructor_calendar_events` is never populated, so all external events display without their Google Calendar colors.

### Fix

**1. Update `google-calendar-service/index.ts`** — Extract `colorId` from Google Calendar events and map it to hex colors

Google Calendar uses numeric `colorId` values (1-11) that map to specific colors. The edge function needs to:
- Add a color map (Google's standard event color palette)
- Extract `colorId` from each event in the API response
- Store the mapped hex color in the `color` column when inserting events

**Google Calendar Event Color Map:**
```
1: #7986CB (Lavender)
2: #33B679 (Sage)
3: #8E24AA (Grape)
4: #E67C73 (Flamingo)
5: #F6BF26 (Banana)
6: #F4511E (Tangerine)
7: #039BE5 (Peacock)
8: #616161 (Graphite)
9: #3F51B5 (Blueberry)
10: #0B8043 (Basil)
11: #D50000 (Tomato)
```

**2. No frontend changes needed** — The schedule views (`NewMobileScheduleView`, `MobileMonthCalendarView`) already query the `color` column and should already use it for rendering. Will verify the color is actually applied in the UI rendering code, and add it if missing.

### Files Changed
- `supabase/functions/google-calendar-service/index.ts` — add color map, extract `colorId`, store hex color
- Possibly schedule view components if color isn't being applied to the event rendering

