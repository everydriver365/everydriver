## Plan

1. **Stop presenting missing lessons as a valid course total**
   - Update the course-summary list so `0 lessons` only means there are genuinely zero live upcoming lesson records.
   - If a pupil has no active lesson rows at all, show a clearer live-data state such as `No live lessons recorded` rather than implying the course summary is complete.

2. **Use one consistent live-lesson filter everywhere**
   - Apply the same rules in both:
     - `Course summaries` list
     - Individual pupil course-summary detail page
   - Exclude lessons that are deleted, cancelled, no-show, cancelled via `cancelled_at`, or marked no-show via `marked_no_show_at`.
   - Use Europe/London time for “next lesson” checks.

3. **Separate course/account data from lesson data**
   - Keep course type, instructor, and balances sourced from the pupil/account records.
   - Keep lesson counts and next lesson sourced only from live lesson records.
   - Do not add mock values, fallback lesson dates, or inferred lessons.

4. **Add a visible data warning for missing live lesson records**
   - For pupils like Joseph/Luke/Soraya where the backend currently has no live scheduled lessons, show an explicit status so it’s clear the system has no lesson records to summarise.
   - This avoids silently showing misleading course data.

5. **Verify against the current live rows**
   - Confirm Susanna does not show the cancelled 27 June lesson.
   - Confirm pupils with no live lesson rows show the missing/live-data state.
   - Confirm any pupil with real upcoming active lessons shows the correct next lesson and count.