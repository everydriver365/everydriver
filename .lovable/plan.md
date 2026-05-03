
# Home Screen Restructure

Reorganise the instructor mobile Home screen so the layout flows: greeting → Up Next → Schedule → Quick Access → Needs Attention. Merge the old "Quick Actions" and "Tools / Frequently Used" sections into one unified **Quick Access** block. Pull Vehicle Health, Open Slots, and Dormant Pupils into a single grouped **Needs Attention** card, and stop rendering the standalone Insights, Telematics, Vehicle Health, Idle Time, Impact Alert, and Upcoming Events blocks. All data hooks, handlers, navigation, and the Up Next tile stay untouched — this is purely presentational.

## Files to edit

### 1. `src/components/instructor/MobileHomeRedesign.tsx`
- Move the existing `Needs attention` block from above `MobileHomeBottomSections` to **after** it.
- Remove the JSX rendering for: `ImpactAlertCard`, `InsightTilesGrid` (+ its "Insights" label), `TelematicsTile` (+ "Telematics" label), `VehicleHealthCard`, `IdleTimeCostCard`, `UpcomingEventsCard`. Keep `FloatingSessionBar`. Leave the imports for now (they're harmless) or trim them — either is fine.
- Extend `attentionRows` to include:
  - **Vehicle health fault** — read from existing `VehicleHealthCard` data source (will inspect `useVehicleSecurity` / related hook used inside `VehicleHealthCard`) and only push when a fault exists. Routes to `/instructor/vehicle-health`.
  - **Dormant pupils** — use `useDormantPupilsCount`. Routes to `/instructor/pupils?filter=dormant`.
  - Existing rows (job offers, open slots, unread messages, outstanding balance) remain.
- Group `attentionRows` into two visual sub-groups inside `AttentionCard`: **Urgent** (job offers, vehicle fault) and **To do** (everything else). Render group label only when the group has rows; render the card only when it has at least one row; otherwise show an "All clear" empty state.
- Order after edit: Greeting → StatsRow → Up Next (+expanded) → `MobileHomeBottomSections` → Needs Attention → FloatingSessionBar.

### 2. `src/components/instructor/MobileHomeBottomSections.tsx`
- Merge `QuickActionsSection` + `ToolsSection` into a single **`QuickAccessSection`**:
  - One section header `Quick access` with right-side `Edit` button + `PageDots` (when >1 page).
  - One ⌘K search bar (kept from current ToolsSection).
  - One swipeable 4×2 paged grid (8 tiles per page).
  - Tiles sourced from `useInstructorPinnedTiles().pinnedIds` mapped through `QUICK_ACCESS_TILES_BY_ID` (single source — no separate hard-coded `actions` array).
  - Badge counts wired from existing hooks: `useUnreadMessagesCount` for `messages`, `usePendingJobsCount` for `tests`, `useRealGapSlots` for `fill-gaps`, `useInstructorPupilsPaymentSummary.debtors` for `take-payment`.
  - First tile (`pageIdx 0 && idx 0`) renders with `isPrimary` styling (`#1A52A0`), already implemented.
  - Edit opens existing `CustomizeFrequentlyUsedSheet`, persisting via `setPins` (same as today).
- Drop the old `QuickActionsSection` and `ToolsSection` exports; export only `ScheduleSection` + new `QuickAccessSection` from `MobileHomeBottomSections`.
- Keep the schedule row visual styling already in place — no changes there.

## Data bindings (no new fetches)

| UI piece | Source |
|---|---|
| Schedule lessons + statuses | `useDayLessons`, `useDayLessonHistory` (unchanged) |
| Quick Access tiles | `useInstructorPinnedTiles` + `QUICK_ACCESS_TILES_BY_ID` |
| Quick Access badges | `useUnreadMessagesCount`, `usePendingJobsCount`, `useRealGapSlots`, `useInstructorPupilsPaymentSummary` |
| Vehicle fault row | Existing hook used by `VehicleHealthCard` (will reuse, no new query) |
| Dormant pupils row | `useDormantPupilsCount` |
| Open slots / unread / debt / jobs | Existing hooks already used in `MobileHomeRedesign` |

## Out of scope / hard constraints

- Up Next tile, greeting, stats row, and tab bar unchanged.
- No handler, hook, route, or backend change.
- Mobile-only file; desktop layouts untouched (per project rule).
- No new libraries.
- The first pinned tile auto-styles as primary on reorder (already wired).

## Open question

The prompt mentions `FaultBadge`, `Smart tips`, and a "2×2 card section" that don't currently exist in the live `MobileHomeRedesign` — those are already absent. I'll skip them rather than invent placeholders. If you want a Smart Tips row brought back into Needs Attention, say so and I'll wire it.
