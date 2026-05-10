## Per-postcode rate overrides on Rates & Coverage

Let instructors set a list of outward-postcode → hourly-rate rules that override their default rate when a pupil's pickup postcode matches.

### Behaviour
- Match style: outward code (e.g. `SO22`, `PO15`). Case-insensitive, whitespace-tolerant.
- Override type: replaces the hourly rate for that pupil/lesson.
- Resolution order when pricing: **pupil `custom_hourly_rate`** → **matching postcode rule** → **instructor default `hourly_rate`**.
- Fallback: if no rule matches, default rate applies. Postcodes outside the service radius are still blocked elsewhere.

### Database
New table `instructor_postcode_rates`:
- `id uuid pk`
- `instructor_id uuid` (fk → instructors)
- `outward_code text` (stored upper-cased, e.g. `SO22`)
- `hourly_rate numeric(10,2)` (>= 0)
- `created_at`, `updated_at`
- Unique `(instructor_id, outward_code)`
- Index on `(instructor_id, outward_code)`
- RLS: instructors can CRUD their own rows via `get_instructor_id_for_user(auth.uid())`. Public/pupil read-only `SELECT` allowed for the rows owned by the pupil's instructor (so checkout pricing works for pupil sessions) — same pattern as existing instructor-owned config tables.

### UI — `RatesCoveragePage.tsx`
Add a third card "Postcode rates" below the Coverage card:
- Header: title + sub "Charge a different hourly rate for specific postcode areas. Matched on the outward code (e.g. SO22)."
- Table/list of rules: Outward code input · Hourly rate input · Remove (×). Empty state shows a hint row.
- "+ Add postcode" button appends a blank row.
- Inputs auto-uppercase outward code, strip spaces, max 4 chars; rate is numeric with £ prefix.
- Wired through `useSettingsDirty` so changes save with the sticky "Save all changes" bar (same register/save/reset pattern as existing fields). Save performs a diff against original: insert new, update changed, delete removed.
- Inline validation: duplicate outward codes flagged; invalid format (non `[A-Z]{1,2}[0-9]{1,2}[A-Z]?`) flagged; rate must be > 0. Save disabled if any row invalid.

### Pricing integration
Add helper `src/lib/pricing/resolveHourlyRate.ts`:
```ts
resolveHourlyRate({ pupilCustomRate, pupilPostcode, instructorDefaultRate, postcodeRules }): number
```
- Extracts outward code from `pupilPostcode` and looks up the rule.
- Returns first non-null in priority order.

Wire it where pupil-specific lesson pricing is computed:
- `src/components/instructor/PupilRateEditor.tsx` — show the resolved rate as the displayed default placeholder.
- `src/hooks/useScheduleWeek.ts`, `useDailyEarnings.ts`, `useTodayOverview.ts`, `useTomorrowPreview.ts`, `useWeeklyGoals.ts`, `useLastWeekComparison.ts`, `useInstructorPeriodStats.ts`, `useInstructorReportsData.ts` — when computing per-lesson value for an instructor's pupil, fetch postcode rules once for the instructor and apply the helper using `pupil.postcode`.
- Course discovery / mini-website pages (`useCourseDiscovery`, `MiniWebsiteHome`, `IOSCourseCard`, `DynamicCourseCard`) are NOT in scope — they show the public default rate.

### Out of scope
- Per-postcode surcharges (separate from rate replacement)
- Mobile layout changes
- Bulk import of rules
- Pupil-portal display of postcode rules

### Verification
- Add a rule `SO22 → 42`, save, refresh — rule persists.
- A pupil with postcode `SO22 5DR` and no `custom_hourly_rate` shows £42 as the resolved rate in scheduler/earnings.
- A pupil with `custom_hourly_rate = 38` still shows £38 (custom wins).
- A pupil with postcode `RG1 4XX` and no matching rule shows the instructor default.
- Duplicate / malformed rule entries block saving with an inline error.