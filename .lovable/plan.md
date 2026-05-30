# DSM Pro Rewards — Build Plan

A loyalty/leaderboard system for instructors with Drive 365-branded pupil-facing badges. Fully additive: no existing tables, routes, or components modified.

Given the size (6 new tables, 3 edge functions, ~15 components, 2 new pages, admin panel, pupil pages), I'll deliver this in **5 sequential phases** so each is reviewable and the preview stays working between them.

## Phase 1 — Database foundation

One migration creating:
- `instructor_points` (running total + tier per season)
- `instructor_point_transactions` (audit trail, pending/confirmed/reversed)
- `instructor_badges` (8 badge types, permanent flag for champion)
- `leaderboard_seasons` (seeded with 2026)
- `instructor_rewards` (claim + fulfilment tracking)
- `instructor_complaints` (investigation workflow, held points)
- Adds 3 columns to `instructors`: `show_on_leaderboard`, `notify_tier_change`, `notify_badge_earned`
- All indexes from spec
- Full RLS: instructors read their own rows; admins read all; writes via SECURITY DEFINER RPCs only
- GRANTs for authenticated + service_role on every new table

Also creates `src/constants/rewardsConfig.ts` with `POINT_RULES`, `TIER_THRESHOLDS`, `TIER_REWARDS`, `BADGE_DEFINITIONS`, `SEASON_PRIZES` exactly as specified.

## Phase 2 — Edge functions + cron

- `award-instructor-points` — validates `is_network_placeholder = false`, inserts transaction, upserts points, recalculates tier (with 30-day grace + monthly-only downgrades), triggers badge check + notifications, clamps at 0.
- `check-instructor-badges` — evaluates all 8 conditions, inserts new badges, sends notification.
- `process-rewards-cron` — daily: compliance ±points, loyalty milestones (idempotent), streaks; monthly: tier downgrades after grace.
- `notify-rewards` — thin wrapper around existing `send-push-notification` + `process-email-queue` for the 7 reward notification types.
- Registers daily pg_cron via `supabase--insert` (uses real project URL/anon key).

## Phase 3 — Instructor dashboard surface

- `LoyaltyTile` (gradient #1E4D9B → #0A3070, tier + points + progress to next tier + 3 mini stats, tappable → `/rewards`).
- `PointsActivity` (last 10 transactions, emoji per category, amber "Under review" for pending).
- Mounts both into `InstructorPortal.tsx` and `MobileHomeDSM2026` below the existing stats row only (no other layout changes).

## Phase 4 — Full rewards page + instructor settings

- New route `/rewards` → `src/pages/instructor/RewardsPage.tsx` with 4 tabs: My Rewards / Leaderboard / Badges / Points History. Leaderboard anonymises by default and respects `show_on_leaderboard`; always filters `is_network_placeholder = false`; shows top 20 + own position.
- Adds "DSM Pro Rewards" section to existing instructor settings page with the 3 toggles.
- Reward claim button → inserts `instructor_rewards` row (tier-gated client + server side).

## Phase 5 — Admin panel + Drive 365 pupil surfaces

Admin (route `/admin/rewards`, nav entry in `AdminPortal.tsx`):
- Overview / Leaderboard / Rewards fulfilment / Complaints / Season Management tabs
- Manual point award, CSV export, mark-fulfilled, uphold/dismiss complaints (reverses held points), close season + GoCardless payout trigger reusing `gocardless-instant-bank-pay`.

Drive 365 pupil-facing (Drive 365 blue #0070C0, **no DSM branding, no points/ranks shown**):
- `Drive365TierBadge` on `MiniWebsiteHome` next to `VerifiedProBadge` (Silver+ only).
- `Drive365AchievementBadges` below — pupil-relevant badges only (five_star, pass_machine, on_a_roll, compliant, loyal_pro, champion).
- New route `/rewards` in `everydriverRoutes.tsx` → `RewardsExplainerPage` (hero + 5 tier cards in pupil language + dynamic stats + trust statement).

## Cross-cutting rules enforced everywhere

- `.eq("is_network_placeholder", false)` on every instructor query (per project memory).
- Live data only — no fallbacks; empty states where data is missing (e.g. `driving_test_results` currently empty).
- EOL proxy: presence of linked `lesson_syllabus_updates` row.
- Loyalty points idempotent (check existing transaction before insert).
- Points clamped ≥ 0; tier downgrades only on 1st of month after 30-day grace.
- 3 upheld complaints in a year → tier `suspended` + admin alert.
- All payouts via GoCardless (no Stripe).

## Technical notes

- Adds `tier_drop_grace_period_until timestamptz` to `instructor_points` and a `suspended` value to its tier CHECK constraint (small additions vs. the spec, needed to implement the fairness rules).
- Badge check for `compliant` requires "valid for 3+ months" — implemented by recording first-valid date in a transaction note and comparing on each daily cron run.
- All new tables use SECURITY DEFINER RPCs for writes; client never writes points/badges/transactions directly.
- Existing files touched (additive only): `InstructorPortal.tsx`, `MobileHomeDSM2026.tsx`, instructor settings page, `MiniWebsiteHome.tsx`, `everydriverRoutes.tsx`, `adminRoutes.tsx`, `AdminPortal.tsx` nav.

## Open questions before I start

1. **Settings page target** — which file is the current instructor settings page you want the 3 toggles added to? (There are multiple candidates under `src/pages/` and `src/components/settings/`.)
2. **Scope confirmation** — happy with the 5-phase delivery, or do you want it all in one mega-commit?
3. **Champion badge** — should `is_permanent = true` champions also show on Drive 365 mini-website even after the season closes? (Spec implies yes — confirming.)
