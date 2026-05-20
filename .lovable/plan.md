## Goal

Replace the instructor mobile home screen (`MobileHomeRedesign` rendered from `src/pages/InstructorPortal.tsx` when `isMobile`) with the new DSM-styled layout you spec'd, while keeping every existing data binding, navigation handler, auth flow, and modal behaviour untouched. Desktop home and the `settings-v2` variant are not touched.

## Approach

The spec is React Native pseudocode; the project is React + Tailwind + lucide-react. I'll port section-by-section to web equivalents while preserving the exact visual grammar (tokens, paddings, radii, font weights, shadows).

I'll add a single new file `src/components/instructor/MobileHomeDSM2026.tsx` containing the screen + every subcomponent from your spec (HeroHeader, NextLessonCard, ThisWeekCard, NeedsAttentionCard, CollapsibleSection, UrgentBanner, ScheduleCard, QuickAccessCard, UpcomingEventsCard, MembershipCard). `InstructorPortal.tsx` swaps `MobileHomeRedesign` → `MobileHomeDSM2026` in the mobile branch only.

`MobileHomeRedesign.tsx` is left in place (used nowhere else) so we can revert by flipping one import if you don't like it.

## Data wiring (mapping spec hook → existing hook)

No new hooks, no new API calls, no hardcoded values. Each spec hook resolves to the closest existing one already used by the current mobile home:

- `instructor` → `useInstructorAuth().instructor`
- `nextLesson` → `useNextLessonDetails(instructorId)`
- `stats` (week earnings/lessons/hours, today earnings/lessons) → `useInstructorLiveStats` + `useTodayOverview` + `useWeeklyGoals` (lesson target, hours)
- `todayLessons` → `useTodayOverview().lessons` (same source the current home uses for today/tomorrow)
- `attention` counters → reuse the same hooks already feeding the existing "needs attention" surface: `usePendingJobsCount`, `useUnreadMessagesCount`, `useTestSwapNotifications`, AI calls count from `useAICallDivert`, enquiries from the existing enquiries hook used today
- `events` → existing `UpcomingEventsTile` data hook (kept as-is — I'll render its data, or embed the tile if simpler)
- `membership` → `useInstructorMembership(instructorId)` plus the existing addon count hook for "upgrades"
- Lesson actions Call/Text/Go → reuse the existing handlers already on `UpNextExpanded` / `MapHeroLive` (tel:/sms:/maps deep links)
- All `navigation.navigate(...)` → `useNavigate()` → existing routes already wired in the current home (`/instructor/jobs`, `/instructor/messages`, `/instructor/calls`, `/instructor/schedule`, `/instructor/pupils`, etc.). Any spec route with no existing match (e.g. `Enquiries`, `NextSlot`, `LabFeatures`) is routed to its nearest existing screen — I won't invent new routes.

If any source above turns out to be missing a field the spec references, that field will surface an empty state (per memory rule: no hardcoded fallbacks for DB-sourced values), not a placeholder number.

## Visual rules honoured exactly

- Tokens from your spec used verbatim as inline hex (this screen is already inline-styled like the current `MobileHomeRedesign`, matches the DSM portal pattern). No changes to `tailwind.config.ts` / `index.css` — these hexes are already part of the DSM instructor theme tokens in memory.
- Poppins font stack on every Text node, weights as specified.
- `NextLessonCard` collapsed by default; `NeedsAttentionCard` urgent open iff `urgentCount > 0`; all other collapsibles closed.
- Counter strip items with `value === 0` rendered at `opacity: 0.4`.
- `QATile` active state navy bg / white icon+label, tap navigates + sets active.
- Quick Access search filters both rows simultaneously.
- StatusBar — web has no StatusBar API; the navy hero already gives the iOS status-bar tint via the existing `InstructorPortalLayout` safe-area handling. No change needed.
- DSM logo: use the existing `/public/everydriver-logo-full.svg` or the DSM logo asset already used by `AppHeader` (whichever is the current DSM mark) — I'll reuse, not import a new file.

## Out of scope (explicit)

- Desktop home (`DesktopDashboardV2`) — untouched.
- `settings-v2` layout variant — untouched.
- No new routes, no new hooks, no new DB tables, no new edge functions.
- No tailwind config / index.css edits.
- No mobile layouts for other portals (per Core memory: don't change other mobile layouts).

## Files touched

- **New:** `src/components/instructor/MobileHomeDSM2026.tsx` (~800–900 lines, single file containing all 11 subcomponents from spec)
- **Edited:** `src/pages/InstructorPortal.tsx` — 1-line swap of `MobileHomeRedesign` for `MobileHomeDSM2026` in the mobile branch
- **Untouched:** `MobileHomeRedesign.tsx` (kept as fallback, deletable later once you've signed off)

## Verification

- Build passes (harness auto-runs).
- Manual check on /instructor at mobile viewport: hero renders with logo + name + 3 action buttons; next-lesson tap toggles expanded; week stats show live numbers; needs-attention counters reflect real counts; schedule day strip + today's lessons render; quick access scrolls horizontally with working search; upcoming events + membership show real data.
- Confirm no console errors and no regressions to TakePaymentModal / WelcomeTour / DemoModeBanner which sit alongside the new component.