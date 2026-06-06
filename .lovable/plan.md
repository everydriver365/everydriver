In `src/components/homepage/FeaturedInstructors.tsx`, after the existing `driving_test_results` query, compute a fallback pass rate from `course_reviews.passed_first_time` for any instructor whose `pass_rate` is still `null`:

- Reuse the reviews already being fetched later in the effect (already filtered to `is_visible=true` + `moderation_status=approved`) — move that fetch earlier, or do a small additional aggregate query, so we can count `passed_first_time = true` vs `passed_first_time = false` (ignoring `null`).
- If `total >= 1`, set `pass_rate = (passed / total) * 100`.
- `driving_test_results` keeps priority when present.

No schema changes. No hardcoded fallbacks — both sources are live DB data.
