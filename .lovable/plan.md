## Homepage layout cleanup (desktop only — mobile untouched)

### New section order
1. Hero
2. Video Story (moved up from the bottom)
3. `SeeWhoIsTeaching`
4. Course cards (learning paths)
5. **Backed by EveryDriver** (trust grid — moved to `afterLearningPaths`)
6. `HomepageExtraSections` (what's included)
7. `PupilReviewsSection` (reviews now land after the offer + trust)
8. FAQ / closing CTA (existing)

### Changes in `src/pages/Index.tsx`
- Move the "Backed by EveryDriver" JSX from the `afterHero` prop to the `afterLearningPaths` prop of `<Drive365Home>`.
- Lift the desktop "Video Story" `<section>` (currently below `</Drive365Home>`, ~lines 697+) and pass it into the `afterHero` prop so it sits directly under the hero.
- Delete the inline Swap / Payments / Theory Pro trio (~lines 670–676) — it duplicates cards already inside `HomepageExtraSections`.

### Changes in `src/components/home/Drive365Home.tsx`
- Reorder the render so `PupilReviewsSection` moves to *after* `{afterLearningPaths}` and `HomepageExtraSections` (i.e. reviews become the second-to-last block before FAQ).
  - Current: Hero → afterHero → SeeWhoIsTeaching → PupilReviewsSection → Courses → afterLearningPaths
  - New: Hero → afterHero (video) → SeeWhoIsTeaching → Courses → afterLearningPaths (Backed by) → (HomepageExtraSections renders inside afterLearningPaths children) → PupilReviewsSection

### Out of scope
- No mobile changes (`MobileHomepage` untouched).
- No copy, color, or component-internal redesign — pure rearrangement + one duplicate removed.
- No data/RLS/backend changes.
