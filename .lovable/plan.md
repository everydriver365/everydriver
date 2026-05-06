## Why Ken D's courses don't show on winchesterdrivingschool.co.uk

Three independent issues:

1. **Ken D's `instructors.available_from` is `2026-06-01`** (today is 6 May 2026). Every availability filter in `useCourseDiscovery` and `useFeaturedCourses` excludes him until 1 June, so `/courses` on the Winchester domain renders no dates in May.
2. **The whitelabel homepage's featured courses aren't scoped to Ken.** `src/pages/Index.tsx` calls `useFeaturedCourses(3)` with no instructor filter, so it pulls from all platform instructors.
3. **The calendar doesn't auto-jump to the first month with availability** for a whitelabel-scoped instructor. It defaults to the current month (May), looks empty, and the user has to manually switch to June.

## Fix

### 1. Update Ken D's `available_from`
Migration to set `available_from = NULL` (or to today) for the Ken D instructor row so May availability immediately appears. Confirm with the user whether Ken really wanted June 1 — if yes we leave the DB alone and rely on fixes 2 + 3.

### 2. Scope `useFeaturedCourses` to the whitelabel instructor
- Add an optional `instructorId?: string | null` parameter to `src/hooks/useFeaturedCourses.ts`.
- When set, scope the `instructors`, `instructor_courses`, `instructor_working_hours`, and `instructor_date_overrides` queries with `.eq("...", instructorId)` (mirroring `useCourseDiscovery`).
- In `src/pages/Index.tsx` and `src/components/MobileHomepage.tsx`, resolve the slug via `getWhitelabelConfig()?.instructorSlug`, look up the instructor id once, and pass it into `useFeaturedCourses`.

### 3. Auto-jump the whitelabel `/courses` calendar to the first month with availability
`useCourseDiscovery` already calls `findFirstAvailableDate` after fetch and sets `selectedMonth`/`selectedDate`. Verify it runs when `instructorId` is passed (it does: effect depends on `instructorId`). If the resulting month differs from "now", the SidebarCalendar must reflect it — confirm `SidebarCalendar` uses the controlled `selectedMonth` prop (it does). No code change needed beyond confirming, but add a fallback: if `nextAvailableDates[0]` is in a future month and `selectedMonth` is still the current empty month, surface a one-tap "Jump to {Month}" button in the empty-state panel in `WhitelabelCourses.tsx` (in addition to the existing date chips) so the calendar UI clearly moves.

### 4. (Optional UX) Show "Available from 1 June" banner
On `WhitelabelCourses.tsx`, when `availableDatesInMonth.length === 0` but `instructor.available_from` is set, show "{Brand} is taking bookings from {date}" so visitors understand why May is empty.

## Question for you

Do you want me to **clear Ken D's `available_from` field** (so courses show immediately in May), or keep `2026-06-01` and rely on fixes 2 + 3 to show his June availability prominently from the homepage and `/courses` page?