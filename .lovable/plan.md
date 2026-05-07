## Root cause

There are only 4 active instructors in the database, and only one of them (Ken D) actually serves Hampshire / the SO postcode area:

| Instructor | Postcode | Active courses | `available_from` |
|---|---|---|---|
| Martin B | E2 7NJ (London) | 7 | 2026‑01‑11 |
| Sarah Mitchell | E2 7NJ (London) | 4 | — |
| Richard Chapman | SO22 5DB | **0** (no active courses) | — |
| **Ken D** | **SO30 2TD** | 5 | **2026‑06‑01** |

Today is 7 May 2026. `Courses.tsx → isDateAvailable()` (lines 335‑364) explicitly skips any instructor where `available_from` is in the future. So:

- **drive365.co.uk/courses?postcode=SO30+2TJ** — radius 10 miles only reaches Ken D (SO30 2TD). He is gated until 1 June, so the calendar shows zero available dates and zero courses. The London instructors are 70+ miles away and excluded by the radius filter.
- **winchesterdrivingschool.co.uk** — the whitelabel page is hard‑pinned to `ken-d` and shows the "Next available dates" empty‑state with the message "Winchester Driving School is taking bookings from 1 June 2026" (this is correct behaviour, not a bug).

The geocoding edge function is working correctly (verified: `SO30 2TJ → Eastleigh, 50.93/-1.29`). The whitelabel "Instructor not found" string never fires because `ken-d` exists and is active — that label is simply the worst‑case fallback in `WhitelabelCourses.tsx`.

So the real, single, fixable cause is: **Ken D's `available_from` is set to 1 June 2026**, which hides all his Hampshire courses across both Drive365 and Winchester Driving School until that date.

## What I'll change

1. **Clear `instructors.available_from` for Ken D** (set to `NULL`) via a migration so his courses become bookable immediately on Drive365 and WDS. (If you'd rather keep the 1 June date but show the courses now and just defer the bookable start date, tell me and I'll do that instead — but the current code path uses `available_from` as a hard "do not show" gate, not a soft start date.)

2. **Improve the empty‑state on `/courses` (Drive365)** so a learner who searches a Hampshire postcode and finds nothing within 10 miles sees an honest message like *"No instructors within 10 miles of Eastleigh — try widening your search to 25 or 50 miles."* and an auto‑expand button, instead of the silent calendar with no dates. Today they just see a blank calendar with no explanation.

3. **Add a "Coming soon — available from {date}" banner** on the whitelabel WDS page when the pinned instructor's `available_from` is in the future, so learners aren't confused by an empty calendar there either.

## Files I'll touch

- `supabase` migration: `UPDATE instructors SET available_from = NULL WHERE id = 'c9843b58-…';` (Ken D)
- `src/pages/Courses.tsx` — empty‑state UX when `instructorsInArea` is empty after a postcode search
- `src/pages/WhitelabelCourses.tsx` — clearer banner when `availableFrom` is set and in the future

No edge function or schema changes; no auth or RLS changes.

## What I will NOT do without confirmation

- Add more demo instructors / courses to the database (live‑data policy).
- Change the default search radius from 10 miles.
- Touch the geocoding edge function (it is healthy).
