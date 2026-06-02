
## Goal

On `/courses`, always prefer real Drive365 instructors. Only show network (placeholder) instructors when there are zero real instructors covering the searched area.

## Behaviour

1. **Initial page load (no postcode)**
   - Show real instructors and their courses only (current behaviour after the recent fix).
   - Do NOT load any network placeholders — keeps the page fast and avoids the 5,796-row flood.

2. **Postcode/district search**
   - Step A: Run the existing search against real instructors + their courses for the searched district/radius.
   - Step B: If Step A returns one or more matching real instructors, render those only. Network placeholders stay hidden.
   - Step C: If Step A returns zero matching real instructors, lazily fetch placeholder instructors + courses scoped to that district (already wired via `loadedPlaceholderDistrictsRef` and `fetchCoursesForInstructorIds`) and render those as the fallback.
   - Existing radius expansion (10mi → 25mi warning) runs against real instructors first, then against placeholders only if still empty.

3. **No UI/card/sort/filter changes** — same components, same booking flow, same availability engine. Only the data-source gating logic changes.

## Files

- `src/pages/Courses.tsx` only.

## Technical detail

- Keep `realInstructorIds` initial fetch as-is.
- In `handleSearch`:
  - Compute `realMatches` from `coursesForSearch` filtered to non-placeholder instructors in the searched district/radius.
  - If `realMatches.length > 0` → set results from `realMatches`, do NOT trigger placeholder load.
  - Else → call the existing lazy placeholder fetch for that district, recompute matches from the merged set, render those.
- Add a small badge/label is out of scope — visually placeholders already render via existing card; no copy change unless asked.

No DB changes, no schema changes, no other components touched.
