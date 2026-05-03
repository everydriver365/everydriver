# Home Screen Visual Redesign — Schedule, Quick Actions, Tools

Apply the new compact iOS-flavoured layout below the existing **Needs Attention** block in `MobileHomeRedesign.tsx`. All data, handlers, hooks, badges, navigation and state remain bound to the existing sources — this is presentation-only.

## Files affected

1. `src/components/instructor/MobileHomeRedesign.tsx` — replace the three blocks below `Needs attention` (currently `QuickAccessSwipeablePaged`, `ImpactAlertCard`, `InsightTilesGrid`, `Telematics`, etc.) so the new sections render in the specified order. Keep `ImpactAlertCard`, `Insights`, `Telematics`, `VehicleHealthCard`, `IdleTimeCostCard`, `UpcomingEventsCard`, `FloatingSessionBar` rendered after the new three (no removals — just slot the redesigned trio in).
2. `src/components/instructor/HomeTodaySchedule.tsx` — refactor the visual block only into the new compact card (header row, Today/Tomorrow toggle, lesson rows, NOW line, Add lesson row). Continue using `useTodayOverview`, `useDayLessons`, `useDayLessonHistory`, `AddLessonSheet`, `EndLessonWizard`. Existing loading/empty/error states preserved.
3. `src/components/instructor/HomeQuickActions.tsx` — replace `WarmTileGrid` rendering with the new 4-column pinned-actions grid (two rows of 4). Continue to read the same `actions` array; pinned subset comes from existing user prefs (`useInstructorTilePreferences` if present, else first 8). Edit affordance opens the existing edit mode (or routes to the existing Tools editor if no inline edit exists — see Open Questions).
4. `src/components/instructor/HomeToolsHub.tsx` — keep all existing logic for pins/categories/edit mode. Replace the "Frequently used" presentation block with the swipeable 4×2 paged grid + `⌘K` search bar + page dots + swipe hint. The first pinned tile is rendered with `isPrimary` styling (`#1A52A0` background). Categories/Edit mode below remain untouched.

## New presentational components (kept inline in their parent files)

- `ScheduleSectionHeader` — uppercase 10px label + "View all →" link.
- `DayToggle` — Today/Tomorrow pill toggle bound to existing `selectedDay` state in `HomeTodaySchedule`.
- `ScheduleLessonRow` — compact row (3px status bar, time block, name + type/address, `StatusPill`).
- `StatusPill` — maps `done | upcoming | inProgress | cancelled` → bg/colour/label per spec. Uses existing `minutesUntil` already calculated.
- `NowLine` — only renders when current time falls between two lessons in the rendered list.
- `AddLessonRow` — wraps existing `AddLessonSheet` open handler.
- `QuickActionTile` + `BadgeDot` — 4-col grid tile with icon chip + label + badge dot. Reads `iconBg`/`iconColor` from a static map per `action.id` (Add lesson, Message, Fill gap, Payment, Schedule, Pupils, Earnings, Tests).
- `ToolsSearchBar` — routes to existing tool search / command palette.
- `FrequentlyUsedHeader` — label + page dots bound to `currentToolPage` (new local `useState(0)` driven by the swipe container).
- `ToolTile` + `FaultBadge` — uses existing pinned tools data, primary tile styled blue.
- `SwipeHint` — only when `pages.length > 1`.

## Data bindings (no new API calls)

| UI piece | Existing source |
|---|---|
| Today/Tomorrow lessons | `useTodayOverview` + `useDayLessons` (already in `HomeTodaySchedule`) |
| Lesson status (done/upcoming/inProgress/cancelled) | Existing `lessonStatus` + `useDayLessonHistory` (EOL) |
| `minutesUntil` for upcoming pill | Existing `liveMinutes` calc in `MobileHomeRedesign` / row-level countdown |
| Add lesson handler | Existing `AddLessonSheet` open state |
| Pinned quick actions + badges | Existing `HomeQuickActions` `actions` array + `useUnreadMessagesCount`, `usePendingJobsCount`, `useRealGapSlots`, `useInstructorPupilsPaymentSummary` |
| Pinned tools, badges, fault labels, primary | `useInstructorPinnedTiles` (already used in `HomeToolsHub`) |
| Tool search / ⌘K | Existing search route used by `HomeToolsHub` search input |

## Spacing tokens (applied verbatim)

Section label `mb 8`, between sections `14`, schedule card `mb 12`, quick action row gap `7`, rows margin `7`, quick actions `mb 14`, tool grid gap `7`.

## Hard constraints honoured

- No changes above **Needs Attention**.
- No changes to handlers, hooks, routes, or backend.
- No new libraries.
- All badges / fault labels / lesson data bound to live sources.
- `isPrimary` = first item in `pinnedTools` (auto-updates on reorder).
- Loading and empty states for the schedule list preserved (existing skeleton + "No lessons today" message).

## Open questions before I implement

1. **Quick Actions "Edit" affordance** — there's no existing inline edit mode for the home Quick Actions grid (edit currently lives inside `HomeToolsHub` for pinned tools). Options:
   - (a) Tap "Edit" navigates to `/instructor/tools` (the existing Tools edit screen), OR
   - (b) Build a lightweight inline edit mode reusing the same `useInstructorPinnedTiles` hook.

2. **Pinned Quick Actions source** — the current `HomeQuickActions` shows all 11 actions. Should I:
   - (a) Take the first 8 from the existing array as the pinned set (zero new state), OR
   - (b) Wire it to `useInstructorPinnedTiles` so it's user-configurable (shares state with Tools)?

Please confirm 1 and 2; I'll default to **1(a) + 2(a)** if you just say "go".
