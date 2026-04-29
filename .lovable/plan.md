# Make Step 4 use full live availability

Today Step 4 already respects live lessons + Google Calendar busy + instructor buffer + first-lesson travel from home. It does NOT respect:

1. Instructor working hours / day-of-week schedule
2. Date overrides (holidays, one-off changes)
3. Manual blocks (lunch, time off)
4. Travel time between back-to-back pupils (only first-of-day uses travel)

Fix: extend the existing `dayCache` and `isAvailable()` in `src/components/instructor/end-lesson/StepBookNext.tsx`. The slot suggestion pipeline (best/gap/preference/urgency/fallbacks) and visual rendering stay exactly as they are.

## Data added to the up-front fetch

Run in parallel with the existing calendar query:

- `instructor_working_hours` — `day_of_week`, `start_time`, `end_time`, where `is_active = true`
- `instructor_date_overrides` — for the 7-day window
- `instructor_manual_blocks` — for the 7-day window
- Upgrade per-day `scheduled_lessons` query to also pull `pupil_id` and the joined `pupils.postcode` so we can compute travel between adjacent pupils

## Per-day window computation

For each of the next 7 days, derive a `window: { start, end }` (epoch ms):

- If a date override exists and `is_available = false` → `window = null` (instructor off)
- If override exists and is available → use override `start_time` / `end_time`
- Otherwise → use the matching `instructor_working_hours` row for that day_of_week
- If no working hours row → `window = null` (not a working day)

Cache `window`, `existing` lessons (with pupil postcode), `cal` busy windows, and `blocks` per day.

## Per-pupil travel cache

Add a `Map<"FROM→TO", minutes>` cache. Helper `lookupTravelMinutes(from, to)` calls `check-travel-buffer` once per unique pair, falls back to 10 minutes on error or null postcode. Used for both first-of-day (home → pupil) and back-to-back (prev pupil → this pupil → next pupil) checks.

## New `isAvailable(dateStr, hhmmss)` (async)

Order of checks — first failure wins:

1. `window` is null → fail (not working that day)
2. Candidate start/end must sit fully inside `window`
3. Manual block overlap (no buffer — explicit blocks are hard) → fail
4. Calendar busy overlap ± `bufferMinutes` → fail
5. If no earlier commitment that day → enforce `window.start + max(homeTravel, bufferMinutes)`
6. Direct overlap with any existing lesson ± `bufferMinutes` → fail
7. Find immediately previous + next lesson; for each:
   - Required gap = `max(travel(prevPostcode → pupilPostcode), bufferMinutes)`
   - Required gap (next side) = `max(travel(pupilPostcode → nextPostcode), bufferMinutes)`
   - Fail if candidate start violates prev requirement, or candidate end violates next requirement

Because `isAvailable` becomes async, every call site in the candidate pipeline becomes `await isAvailable(...)`. All existing pipeline logic and ordering stays the same.

## Out of scope (intentionally unchanged)

- Slot suggestion categories (best / gap / preference / urgency / fallbacks)
- Reasoning text and dedup rules
- Sort order (genuine best-match first, then chronological)
- Visual rendering, pickup row, identity bar, footer
- The `check-travel-buffer` edge function itself
- Vehicle availability / multi-vehicle constraints (still not modelled)

## Files to edit

- `src/components/instructor/end-lesson/StepBookNext.tsx` — the `load()` function only (data fetch + `isAvailable`); pipeline below is awaited but otherwise unchanged

## Risk notes

- `isAvailable` becoming async means each candidate evaluation now potentially awaits two `check-travel-buffer` calls. Mitigation: pairwise `travelCache` collapses repeated edges (most days have ≤ 5 unique pupil pairs). With at most 3 returned suggestions and early-exit on first match per category, real call counts stay low.
- If `instructor_working_hours` is empty for a brand-new instructor, the screen will show "no slots" rather than the old hardcoded 09:00 fallback. This is the correct behaviour but worth knowing.
