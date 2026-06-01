## Problem

The "Test readiness" card on the instructor pupil profile (`PremiumPupilProfile.tsx`) is driven by `pupils.progress` — a manually-set column that is rarely (never) updated. For Joseph Thorne it reads `0`, even though he has 4 DVSA competencies in progress and 1 completed lesson.

The rest of the app already has a correct formula in `src/components/instructor/TestReadinessScore.tsx`:

```
syllabusPercent = mastered (level≥5) / 27 competencies
hoursPercent    = min(100, completedLessons / 45 * 100)
levelPercent    = avg(level across tracked competencies) / 5 * 100
readiness       = round(syllabusPercent*0.4 + hoursPercent*0.3 + levelPercent*0.3)
```

The profile page should use the same formula so the number, progress bar, status label ("Ready for test" / "Building confidence" / "Early stage"), the `StatPill` "Progress", and the AI bullet copy at L1676/1681 all reflect real data.

## Plan

1. **Fetch syllabus progress + completed lesson count for the pupil** in `PremiumPupilProfile.tsx`:
   - Query `pupil_syllabus_progress` (`competency_id`, `level`) for `pupil_id`.
   - Use existing `stats.totalLessons` (already computed) — or, if it includes scheduled future rows, derive `completedLessons` from the existing `lesson_history` count + completed `scheduled_lessons`.

2. **Replace the `progressPct` `useMemo`** (L601–605) with the weighted formula above, returning `null` only when there is genuinely no data (no syllabus rows AND no completed lessons), so the "Progress not yet recorded" state still appears for brand-new pupils.

3. **Keep all downstream consumers unchanged** — `StatsRow`, `ProgressOverview` bar/label, AI bullets at L1676/1681, and the L1908 share card all read `progressPct` and will pick up the new value automatically.

4. **Leave `pupils.progress` column alone** — no DB write, no migration. We just stop trusting a stale column on this surface. Other surfaces that already use `TestReadinessScore` are unaffected.

## Out of scope

- No DB schema changes, no backfill of `pupils.progress`.
- No changes to the syllabus hub, pupil portal readiness card, or instructor dashboard tiles.
- No edits to the EOL / lesson-completion flow.

## Technical notes

- File: `src/pages/PremiumPupilProfile.tsx` only.
- Add one `useQuery` for `pupil_syllabus_progress` keyed on `["pupil-syllabus", pupilId]`, and import `DVSA_SYLLABUS` from `@/constants/dvsaSyllabus` for the denominator (27).
- Guard against empty arrays to avoid `NaN`.
