## Goal

Bring back the original `NextUpTile` (with its expanding/collapsing sections, smart prompts, end-lesson wizard, route recorder, traffic ETA, in-lesson controls etc.) inside the new redesigned mobile home, replacing the slim custom "Up next" tile that currently lives there.

## What changes

Single file: `src/components/instructor/MobileHomeRedesign.tsx`

1. Import the existing tile:
   ```ts
   import { NextUpTile } from "@/components/instructor/NextUpTile";
   ```

2. Replace the local `<UpNextTile … />` render in the `Up next` section with `<NextUpTile … />`, wired to the same props that `InstructorMobileHome.tsx` already uses (lessonId, pupilId, pupilName, pupilProfileImage, pupilPhone, lessonDate, pickupPostcode, pickupLocation, startTime, minutesUntil → `liveMinutes`, accountBalance, prepaidHours, durationMinutes, instructorId, checkInStatus, lessonStatus, lastLessonPlan).

3. Wrap it in a `padding: 0 14px 14px` container so it visually matches the other sections of the redesigned home.

4. Leave the local `UpNextTile`, `MapHero` overlay component and `MapHeroStatic` import in place but unused in the render (the function is still defined for now — easy to delete later if you confirm you don't want the slim variant anywhere).

## What stays the same

- Greeting block, stats row, attention card, and the new design tokens are untouched.
- All data hooks (`useNextLessonDetails`, `useTodayOverview`, etc.) are unchanged.
- `NextUpTile` itself is not modified — you get back its full state machine: early / mid / starting_now / in_lesson, the expand chevron, smart prompts, traffic ETA, navigate/call/message row, Start lesson and End lesson CTAs, route recorder, etc.

## Out of scope

- Restyling `NextUpTile` to the new red/blue brand palette. It will render in its existing iOS visual language inside the redesigned page. Say the word and I'll do a follow-up pass to recolour it.
