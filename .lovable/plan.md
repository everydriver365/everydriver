## Fix: White-label courses page jumps to first month with availability

### Problem
On `winchesterdrivingschool.co.uk/courses`, Ken D's `available_from` is `2026-06-01`. The discovery hook correctly hides all dates before that, so the calendar (which opens on the current month, May 2026) shows nothing and the page renders the empty state.

### Change
In `src/pages/WhitelabelCourses.tsx`, after `useCourseDiscovery` finishes loading, if the current `selectedMonth` has zero `availableDatesInMonth`, automatically advance `selectedMonth` (and `selectedDate`) to the first month in `monthOptions` that does contain availability. The hook already exposes `setSelectedMonth`, `setSelectedDate`, `monthOptions`, and computes `availableDatesInMonth` per month — we walk forward through `monthOptions`, recomputing availability via the same instructor/working-hours/overrides data the hook already loaded.

Implementation detail: the hook only returns `availableDatesInMonth` for the currently selected month, so we'll add a small effect that, once `loading` is false and `availableDatesInMonth.length === 0`, steps `selectedMonth` forward one month at a time (up to the 18-month window) until a month with available dates is found, then sets `selectedDate` to the first date in that month. Guarded so it only runs once per data load to avoid loops.

### No other changes
- No DB edits — Ken's `available_from = 2026-06-01` is preserved.
- No changes to the standard `/courses` page or `useCourseDiscovery` hook.
- No postcode/distance UI added back.

### Files
- `src/pages/WhitelabelCourses.tsx` — add auto-advance effect.
