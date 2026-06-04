# Fix "Students" stat on Admin Instructor Detail

## Problem
On `/admin/instructors/:id`, the hero card's "Students" stat shows `—` for every instructor. The value is hardcoded in `InstructorHeroCard.tsx`, even though `AdminInstructorDetail.tsx` already fetches `counts.activePupils` from the live database.

## Fix
1. **`InstructorHeroCard.tsx`** — accept a new optional `activePupils?: number | null` prop and use it as the value of the Students `<Stat>` (formatted as a number, or `—` when null).
2. **`AdminInstructorDetail.tsx`** — pass `activePupils={counts.activePupils}` into `<InstructorHeroCard />`.

## Notes
- Uses the existing query (same source as `useActivePupilsCount`: `pupils` where `instructor_id = id` and `deleted_at IS NULL`). No new DB calls.
- Live-data-only: if the count query fails, render `—` rather than a fallback number.
- No other UI, layout, or behaviour changes.
