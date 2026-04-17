
The schedule page (`/instructor/schedule`) uses `MultiDayScheduleView` which renders lessons via `ExpandableLessonCard`. I need to detect significant gaps between consecutive lessons within a day and surface a "Fill this gap" prompt that uses the existing `send-gap-sms` edge function.

The codebase already has all the plumbing:
- `send-gap-sms` edge function — accepts `slots[]` with date/startTime/endTime + discount, sends SMS to pupils with reply tracking
- `useRealGapSlots` hook — pattern for finding free slots
- `WeatherAlertBanner` "Notify" red gradient button — visual reference

## Plan

**1. Detect in-day gaps in `MultiDayScheduleView.tsx`**
For each day's sorted lessons, compute the gap (in minutes) between one lesson's end time and the next lesson's start time. A "significant" gap = ≥ 90 minutes (enough for a 60-min lesson + buffer). Skip days with no lessons or single lessons.

**2. Insert a `GapFillCard` between lesson tiles**
A slim inline card rendered between two `ExpandableLessonCard`s when a significant gap exists. Shows:
- Icon + "X hr Y min gap" + the actual time window (e.g. "11:30 – 14:00")
- Compact "Text Pupils" button (red gradient, matching the WeatherAlertBanner Notify aesthetic for visual consistency)

**3. Wire up the SMS send**
On click, open a confirmation sheet (reuse `Sheet` from shadcn) showing:
- The gap slot details
- Optional discount toggle (% or £, like existing gap SMS UI)
- "Send to all active pupils" button → invokes `send-gap-sms` edge function with a single slot built from `{ date, startTime, endTime }`
- Toast confirmation with sent count

**4. Files to create/edit**
- NEW `src/components/instructor/GapFillCard.tsx` — inline gap row + sheet trigger
- NEW `src/components/instructor/GapFillSheet.tsx` — confirmation sheet with discount controls + invoke logic
- EDIT `src/components/instructor/MultiDayScheduleView.tsx` — compute gaps per day, interleave `GapFillCard`s between lesson cards

## UX
- Threshold: ≥ 90 min gap inside working hours only (between two lessons same day)
- Compact 1-line tile, muted background, red-accented action button on the right
- Mobile-first (390px viewport) — text truncates, button stays visible
- After successful send: tile shows "✓ Sent to N pupils" for the session

## Technical notes
- Time math: parse `start_time` (HH:mm:ss) + `duration_minutes` → end minutes; next lesson start minutes; diff in minutes
- Edge function already creates `gap_offers` rows and handles Twilio reply tracking — no backend changes needed
- Per memory rule on mobile: this is the user's explicit request for the schedule page, so permitted
