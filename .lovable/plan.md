

## Features Available to Add to the Next Up Tile

After reviewing the codebase, here are recently built features that could be integrated into the Next Up tile's expanded section:

### 1. Weather Conditions Strip
- **Component exists**: `WeatherWidget.tsx` + `useDrivingAlerts` hook already provides `CurrentWeather` data (temperature, wind, weather code, driving safety tips)
- **What it would show**: A compact row inside the expanded tile showing current weather + driving safety tip (e.g. "Watch for ice on roads", "Reduce speed in rain")
- **Why it fits**: Instructor is about to drive — weather context is directly relevant

### 2. Pupil's Last Lesson Notes / Next Plan
- **Component exists**: `PostLessonReview.tsx` stores `lesson_notes` and `next_lesson_plan` per lesson
- **What it would show**: A small "Last lesson" row showing what was covered and what was planned for this session — so the instructor doesn't need to navigate away to remember
- **Why it fits**: Quick context refresh before heading to the pupil

### 3. Vehicle Health Quick Status
- **Component exists**: `VehicleHealthStrip.tsx` + `useVehicleHealth` hook
- **What it would show**: A compact battery/ignition/connection status indicator inside the tile
- **Why it fits**: Pre-lesson vehicle readiness check at a glance

### 4. Payment Due Warning
- **Data already available**: The tile already has `accountBalance` and `prepaidHours` — but only shows it in the expanded info badges
- **Enhancement**: Add a prominent amber/red warning banner (similar to the running-late alert) when the pupil has a negative balance or zero prepaid hours, prompting "Collect payment" with a quick action button
- **Why it fits**: Prevents instructors from forgetting to collect payment

### 5. Check-In Status Badge
- **Component exists**: `LessonCheckInBadge.tsx` — shows Confirmed/Declined/Awaiting status
- **What it would show**: A small badge on the header row showing whether the pupil has confirmed attendance
- **Why it fits**: Instructor knows at a glance if the pupil is confirmed or hasn't responded

---

### Recommendation

I'd suggest adding **all 5** as they're lightweight additions to the expanded section. The implementation would be:

1. **Weather row** — Add `useDrivingAlerts` hook call, render a compact weather + safety tip row in the expanded section (between ETA and unread messages)
2. **Last lesson context** — Query the pupil's most recent completed lesson's `next_lesson_plan` field, show as a collapsible row
3. **Vehicle health mini-strip** — Render battery + connection as small icons in the info badges grid (or as a 4th column)
4. **Payment warning banner** — Add an amber alert banner (like the running-late one) when balance is negative
5. **Check-in badge** — Add the `LessonCheckInBadge` next to the "Next Up" label in the header

Each is a small, self-contained addition. Shall I implement all of them, or would you prefer to pick specific ones?

