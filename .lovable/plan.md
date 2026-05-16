## Problem

Searching a postcode like `EH12 3XX` on `/drive365` (which routes to `/courses?postcode=…`) finds the two network-placeholder ("mock") instructors for district `EH12` and they do have active courses — but the grid renders empty.

## Root cause

In `src/pages/Courses.tsx`, `handleSearch` (≈lines 650–689) handles three cases for picking the initial `selectedDate`:

1. Real instructors nearby → `findFirstAvailableDate(instructorsNearby, …)`
2. Nothing nearby → expand radius / fall back to all instructors
3. **Only placeholders nearby** → calls `findFirstAvailableDate(placeholders, availabilitySources)` again

Case 3 is broken: `findFirstAvailableDate` delegates to `hasInstructorAvailabilityOn`, which always returns `false` for `is_network_placeholder` rows (they have no `instructor_working_hours` etc.). So `selectedDate` is set to `null`, and `coursesForSelectedDate` short-circuits to `[]` — the user sees no instructors even though `instructorsInArea` correctly contains the two EH12 placeholders.

`availableDatesInMonth` (≈line 471) already handles this case correctly by switching to `hasNetworkPlaceholderAvailabilityOn` when `placeholdersOnly` is true; the bug is only in the initial date-selection inside `handleSearch`.

## Fix

In the `else if (hasPlaceholderNearby && !hasRealNearby)` branch of `handleSearch`, pick the first date for which `hasNetworkPlaceholderAvailabilityOn(day)` returns true (typically today, otherwise the next weekday/weekend window) instead of calling `findFirstAvailableDate`. Set `selectedMonth` and `selectedDate` from that date.

Also remove the now-unused real-instructor `findFirstAvailableDate` import path branching, and keep the existing toast/notice behaviour.

## Files to change

- `src/pages/Courses.tsx` — placeholder-only branch in `handleSearch` (≈676–686). Replace the `findFirstAvailableDate(placeholders, …)` call with a small loop over `monthOptions` that uses `hasNetworkPlaceholderAvailabilityOn(day)` to pick the first valid date, then set `selectedMonth`/`selectedDate`.

No DB, RLS, or edge-function changes are required — the data and `public_instructors` view already expose the EH12 placeholders correctly.

## Verification

1. Visit `/drive365`, enter `EH12 3XX`, submit.
2. Expect the two placeholder instructors (Daniel King, Ava Young) to appear as enquiry course cards for today's date.
3. Re-test with a real-instructor postcode to confirm the normal path is unaffected.
