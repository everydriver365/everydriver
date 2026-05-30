## Plan: DSM Pro Rewards explainer page

Two new mobile-only pages, no existing files modified except routes + the single "View rewards →" link.

### New files

1. **`src/pages/instructor/RewardsExplainerPage.tsx`** — the full scrolling explainer per spec
   - Sections: header bar, hero banner (gradient `#1E4D9B → #0A3070`), "How you earn points" (3 cards: Course / Lesson / Compliance), "Points deductions" card, "Your tiers" (5 stacked cards with active highlight), "Year-end prize" gradient card, "How it's kept fair" card, bottom CTA → leaderboard + support link.
   - Pulls current tier + total points live from `instructor_points` (current season) for the signed-in instructor via `useInstructorAuth` — no fallbacks; if missing show "🥉 Bronze · 0 pts" only when the row genuinely doesn't exist yet (empty state, not a hardcoded default).
   - Sources point rules, tier thresholds, tier rewards, and emoji from existing `src/constants/rewardsConfig.ts` (extended only with any missing copy strings the spec lists that aren't already there) — point amounts in the UI are derived from `POINT_RULES`/`TIER_THRESHOLDS`/`TIER_REWARDS` rather than re-hardcoded.
   - Lucide equivalents for the spec's Tabler icons: `ArrowLeft`, `Trophy`, `GraduationCap` (school), `Car`, `ShieldCheck`, `AlertTriangle`, `Info`, `Check`, `Calendar`.
   - Back button uses `navigate(-1)`.

2. **`src/pages/instructor/RewardsLeaderboardPage.tsx`** — standalone mobile leaderboard
   - Lifts the existing Leaderboard tab logic out of `RewardsPage.tsx` (re-implemented, not imported, so the existing page stays untouched).
   - Same query: top 50 from `instructor_points` for current season, joined to `instructors`, filtered `is_network_placeholder = false` and `show_on_leaderboard = true`.
   - Header bar matches the explainer page; back button → `navigate(-1)`.

### Route changes (`src/routes/instructorPortalRoutes.tsx`)

Add two new routes alongside the existing `/instructor/rewards` (which stays as-is, pointing at the current 4-tab `RewardsPage`):

- `/instructor/rewards/explainer` → `RewardsExplainerPage`
- `/instructor/rewards/leaderboard` → `RewardsLeaderboardPage`

Both also added under the no-prefix variants if the existing file mirrors them.

### Single existing-component edit

`src/components/instructor/CourseBonusTile.tsx` — change only the destination of the "View rewards →" link from `/instructor/rewards` to `/instructor/rewards/explainer`. No other changes to that tile.

### Styling notes

- Mobile only — wrapped in the standard instructor mobile portal container; no desktop breakpoint work.
- All semantic colours via `var(--color-*)` tokens already used elsewhere in the portal; brand DSM blue `#1E4D9B`, gold `#FCD34D`, red `#D12E2E`, green `#059669`, amber `#B45309` inlined per spec.
- Radii use the project's mobile scale (`12px` cards, pills `999px`) per the instructor radius memory.
- No dark backgrounds outside the hero and year-end prize cards. Flat — no shadows/gradients elsewhere.

### Out of scope

- No DB migrations, no edge functions, no changes to `RewardsPage.tsx`, `LoyaltyTile`, `PointsActivity`, admin pages, or any pupil-facing surface.
- Desktop layout untouched.
