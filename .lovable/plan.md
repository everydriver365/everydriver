## Two issues to fix

### 1. Not all of Richard's courses show
Richard offers **10 / 20 / 30 / 40** hour courses. The current page is filtering them out for two reasons:

- `useCourseDiscovery` uses **hard-coded** hour buckets:
  - `INTENSIVE_HOURS = [20, 28, 36]`
  - `SEMI_INTENSIVE_HOURS = [30, 36, 40]`
  - `all = [20, 28, 30, 36, 40]`
  
  → Richard's **10 h** course never appears, and on the current `?type=semi-intensive` route only his 30 h and 40 h are eligible.
- Then a second filter checks `course_templates.is_intensive` against the URL `type`. In the templates table the 20 h course is marked `is_intensive=false`, so even on the intensive tab Richard's 20 h is dropped.

**Fix:** make the hour list dynamic.
- Derive the candidate hours from the `course_templates` table (and union with anything an instructor actually offers in `instructor_courses`) instead of from hard-coded arrays.
- Use `course_templates.is_intensive` as the **single** source of truth for the intensive / semi-intensive split. Drop `INTENSIVE_HOURS` / `SEMI_INTENSIVE_HOURS`.
- Result on the current URL (`type=semi-intensive`): Richard shows 20 h, 30 h, 40 h. On `type=intensive`: 10 h. On `all`: 10 h, 20 h, 30 h, 40 h. New course rows added by any instructor in future will automatically flow through with no code change.

### 2. Instructor avatars missing under the booking calendar
`SidebarCalendar.tsx` currently renders only a coloured cell per available date — there is no visual indication of *which* instructor is free that day. We add a small avatar strip under each available date.

**Fix:**
- Extend `useCourseDiscovery` to return a `availableInstructorsByDate: Map<string, Instructor[]>` for the visible month. Built from the same `hasInstructorAvailabilityOn` resolver already used for the green dots, so it stays in lock-step with the booking-time guard.
- Pass this map into `SidebarCalendar` (new optional prop, no behaviour change if absent).
- Render up to 3 stacked `Avatar`s (`-space-x-1.5`, `h-4 w-4`, ring of `bg-card`) under each available date, plus a `+N` chip when more instructors are free. Reuse `@/components/ui/avatar` with `profile_image_url` and initials fallback. Hide on past / unavailable cells. Keep the cell at `h-9` by tightening top padding so the avatars sit at the bottom edge.
- Tooltip on hover lists the instructor names for that date.

### Files touched
- `src/hooks/useCourseDiscovery.ts` — dynamic hour list, drop hard-coded arrays, expose `availableInstructorsByDate`.
- `src/components/courses/SidebarCalendar.tsx` — accept and render avatars per available day.
- `src/pages/everydriver/CourseResults.tsx` — pass the new map through to the sidebar.

### Out of scope
- Mobile layouts (per project rule).
- The booking-time `validate-booking` edge function (Step 3 from the previous plan) — not touched by this change.
