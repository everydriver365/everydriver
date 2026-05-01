## Problem

The current Next Lesson tile on the instructor mobile home (`PremiumIOSHomeView`) uses `NextLessonTile`, which is a thin summary card whose entire surface is a `<Link>` to `/instructor/schedule`. The Call / Navigate / Open buttons we just re-added still leave most of the card behaving as a "go to schedule" link, and it's missing all the rich functionality that existed before the redesign:

- Mini map preview of the pickup location
- Live traffic ETA (with arrival time + condition)
- "I'm here" / check-in flow
- Running late sheet (notify pupil with preset delays)
- Reschedule sheet
- Cancel
- Call / Text (SMS) / Navigate
- End lesson wizard
- Lesson plan / notes preview
- Payment status, balance, prepaid hours

All of that already exists, fully built, in `src/components/instructor/NextUpTile.tsx` (1181 lines). It's the exact component that other home variants (`InstructorMobileHome`, `CleanHomeView`, `CompactHomeView`, `BestMateHomeView`, `LockScreenHomeView`) already use. The premium iOS home is the only one that downgraded to the stripped-down tile.

## Fix

In `src/components/instructor/PremiumIOSHomeView.tsx`:

1. Replace the import of `NextLessonTile as RichNextLessonTile` with the real rich component:
   ```ts
   import { NextUpTile } from "@/components/instructor/NextUpTile";
   ```
2. In the "Next lesson tile" section (around lines 215–239), replace `<RichNextLessonTile instructorId={instructorId} />` with `<NextUpTile ... />` wired up from the `nextLesson` object already returned by `useNextLessonDetails(instructorId)`. All required props are already in that hook's return shape:

   ```tsx
   <NextUpTile
     lessonId={nextLesson.lessonId}
     pupilId={nextLesson.pupilId}
     pupilName={nextLesson.pupilName}
     pupilProfileImage={nextLesson.pupilProfileImage}
     pupilPhone={nextLesson.pupilPhone}
     lessonDate={nextLesson.lessonDate}
     pickupPostcode={nextLesson.pickupPostcode}
     pickupLocation={nextLesson.pickupLocation}
     startTime={nextLesson.startTime}
     minutesUntil={nextLesson.minutesUntil}
     accountBalance={nextLesson.accountBalance}
     prepaidHours={nextLesson.prepaidHours}
     durationMinutes={nextLesson.durationMinutes}
     instructorId={instructorId}
     checkInStatus={nextLesson.checkInStatus}
     lastLessonPlan={nextLesson.lastLessonPlan}
   />
   ```
3. Leave the empty state ("No upcoming lesson" + Add lesson button) exactly as it is.
4. Leave header, Needs Attention, schedule, quick actions, bottom nav, routes, data fetching, auth, and database untouched.

## What you'll get back on the tile

- Pupil avatar with status ring, name, time, countdown
- Pickup postcode + address pills
- **Mini map preview** of pickup location (via `PostcodeMapPreview` / `GoogleMapPreview` already inside `NextUpTile`)
- **Live ETA** with arrival time and traffic condition (`useTrafficETA`)
- Action row: **Call**, **Message (SMS)**, **Navigate**, **Open**
- **I'm here / Check-in** badge and flow (`LessonCheckInBadge`)
- **Running late** sheet with preset delays + SMS to pupil (`RunningLateSheet`)
- **Reschedule** sheet (`RescheduleLessonSheet`)
- **Cancel** dialog (`CancelLessonDialog`)
- **End lesson** wizard (`EndLessonWizard`)
- Last lesson plan preview, payment status, balance, prepaid hours
- Driving alerts + vehicle health hooks

## Files changed

- `src/components/instructor/PremiumIOSHomeView.tsx` — swap import + tile JSX (one section, ~5 lines of import/usage)

## Out of scope

- No changes to `NextUpTile` itself (already complete)
- No DB / RLS / auth / route / hook changes
- No restyle of the rest of the home screen
- The deprecated `NextLessonTile.tsx` stays in place for now (other code may import it; can be cleaned up later)