## Surcharge variables — wiring audit

The three new fields on `instructors` (`weekend_surcharge_amount`, `bank_holiday_surcharge_amount`, `odd_hours_surcharge_amount`) plus `odd_hours_start` / `odd_hours_end` exist in the DB and Supabase types. Here is where they actually flow today, and where they don't.

### Working end-to-end

1. **Settings UI** — `RatesCoverageSections.tsx` → `RateModifiersSection` reads/writes all 5 fields on `instructors`. Saves via the registered settings save handler. ✅
2. **Pricing engine** — `src/lib/pricing/applyRateModifiers.ts` correctly:
   - Adds £/hour for weekend, bank holiday (priority over weekend), and odd-hours window (handles midnight wrap).
   - Loads UK bank holidays from gov.uk, cached in `sessionStorage`. ✅
3. **Learner checkout total** — `src/pages/BookingSummary.tsx` selects all 5 fields, builds `rateModifiers`, and applies surcharges per scheduled slot. Shows a "Surcharges active" indicator when total exceeds base. ✅

### Not wired (gaps)

These places still use the flat `hourly_rate` and never call `applyRateModifiers`, so a learner/instructor sees the base price even when a weekend/BH/off-peak slot is selected:

1. **Course cards / discovery** (`useFeaturedCourses`, `useCourseDiscovery`, `Courses.tsx`, `DemoCourseCards.tsx`, `MiniWebsiteCourseCard.tsx`, mini-website pages) — list price is `hourly_rate × hours`. Surcharges aren't shown. Acceptable because slots aren't picked yet, but a "from £X, may vary at weekends/evenings" hint is missing.
2. **Instructor-side lesson creation** — `AddLessonSheet.tsx` (instructor manually books a pupil) doesn't compute or store a surcharged price. Pupil ledger / earnings will under-charge weekend lessons booked this way.
3. **Earnings / reports / goals** — `useDailyEarnings`, `useWeeklyGoals`, `useInstructorPeriodStats`, `useInstructorReportsData`, `useLastWeekComparison`, `useTodayOverview`, `useTomorrowPreview`, `useScheduleWeek`, `useProfitAnalysis`, `MonthEndReview.tsx` — all multiply `lesson hours × hourly_rate`. None apply surcharges, so dashboards will under-state revenue for weekend/BH/odd-hour lessons.
4. **Pending-jobs / featured / pupil-portal price hints** — same flat `hourly_rate` usage.
5. **Cover Marketplace** (`CoverMarketplace.tsx`) — uses `lesson_price` already stored on the offer; depends on whoever wrote that price applying surcharges (currently doesn't).
6. **WhatsApp/AI quotes** (`WhatsAppChatWidget.tsx`) — quotes lessons at `hourly_rate` only.
7. **`scheduled_lessons` table** — there is no `price_at_booking` / `surcharge_amount` column on the lesson row. Once a lesson is created, the surcharge applied at checkout is not persisted; reports recompute from `hourly_rate`, losing the uplift.

### Minor

- `applyRateModifiers` is only imported in `BookingSummary.tsx`. Worth adding a tiny `getLessonRate(lesson, instructor)` helper and using it in the hooks above.
- Settings UI clamps amounts to £500/hr and step 0.50 — fine.
- No backend/RPC enforcement: an instructor changing surcharges after a lesson is booked would retroactively change reported earnings (see persistence gap above).

### Recommended next steps (pick what you want)

1. **Persist surcharge on each booked lesson** — add `price_per_hour` and `surcharge_amount` (numeric) to `scheduled_lessons`; populate at checkout and in `AddLessonSheet`. Then rewrite the earnings hooks to prefer `price_per_hour` when present, falling back to `hourly_rate`. (Highest impact — fixes reports, profit, goals, month-end.)
2. **Centralise pricing** in a `getLessonPrice(lesson, instructor, modifiers)` helper and replace the ~12 `hours × hourly_rate` usages.
3. **Course cards "from £X" hint** — append "weekend/eve from £Y" subtitle when surcharges are configured.
4. **AddLessonSheet** — compute and show the surcharged price at the moment of manual booking, store it on the row.
5. **AI quoting (WhatsApp widget)** — pass surcharges into the quote prompt.

Tell me which of (1)–(5) you want and I'll implement. Quickest win is (1) + (2) together.
