## What is actually wrong

Ken D is now showing no slots because the scheduler is treating long/all-day Google Calendar entries as hard busy time. His diary contains entries like:

- `Summer term` from 13 Apr to 23 Jul
- `Lotty : No College` spanning 1–2 Jun

Those are all-day/informational calendar items, but the current slot picker blocks them as if Ken is physically unavailable for the whole period. That wipes out every slot. Previous fixes also patched different surfaces separately, so one change fixes one screen and breaks another.

## Proposed solution: rebuild the diary logic into one engine

### 1. Create one shared availability engine
Build a single resolver used by every booking surface:

- Public course list available dates
- Public/pupil slot picker
- Instructor “find slot” / gap tools
- Server-side booking validation

It will resolve slots from the same ordered inputs every time:

1. Instructor working hours / date overrides
2. App diary lessons
3. Manual blocks
4. Timed Google Calendar busy events
5. Instructor buffer
6. Travel time/fallback

No screen should calculate slots itself anymore.

### 2. Define Google Calendar rules clearly
Use consistent rules instead of guessing per component:

- Timed Google events block slots.
- Multi-day/all-day calendar events do **not** block learner slots by default.
- Manual blocks remain the correct way for instructors to block full days/holidays.
- Optional later enhancement: allow specific all-day Google titles like “holiday”, “leave”, “unavailable” to block the day, but I would not add this now because it risks false blocking again.

### 3. Replace `LessonScheduler` slot generation
Refactor `LessonScheduler.tsx` so it only:

- Loads availability sources
- Calls the shared engine
- Renders the slots returned

Remove its local custom conflict logic, especially the current all-day blocking behaviour.

### 4. Strengthen the booking guard
Update `create-booking` so payment-time validation uses the same conflict rules as the shared engine:

- It must reject app diary clashes.
- It must reject manual blocks.
- It must reject timed Google Calendar clashes.
- It must ignore informational all-day/multi-day Google events.
- It must use the same buffer/travel padding as the UI.

This prevents “shown but rejected” and “not shown but should be available” mismatches.

### 5. Add a slot diagnostic helper
Add a small internal diagnostic function/helper for a given instructor/date/duration that reports:

- Working window
- Conflicts used
- Slots accepted
- Slots rejected and why

This will make future diary issues debuggable instead of guessing.

### 6. Verify against Ken D before finishing
Use Ken D’s live data as the test case:

- 1 Jun should remain blocked by actual timed events/lesson conflicts.
- Other days should show slots where working hours have real free time.
- Long events like `Summer term` must not erase the entire calendar.
- Duplicate lessons/events should not create false availability.

## Files expected to change

- `src/lib/courseAvailability.ts`
- `src/lib/availabilityCore.ts` or a new focused shared engine file
- `src/components/booking/LessonScheduler.tsx`
- `src/hooks/useInstructorAvailabilitySearch.ts`
- `supabase/functions/create-booking/index.ts`

## Result

After this, the app will have one diary truth source instead of several inconsistent slot calculators, so fixing one surface should not break another.