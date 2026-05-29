## Goal

Every tile across the instructor app should render as:

```text
┌────────────────────────────┐
│ [icon]  Title              │
│         Subtitle / value   │
└────────────────────────────┘
```

Icon on the left, text block vertically centered next to it. Badges (Active / counts / year chips) move to the far right, also vertically centered.

## Surfaces to update

The instructor app currently has several tile-rendering systems. I'll touch each:

1. **Home info cards** — `MobileHomeDSM2026.tsx` (`cardBase`, all Card 1..N blocks: Upcoming events, Membership, Tax estimate, MTD, etc.)
2. **Quick Access grid** — `quickAccess/QuickAccessSwipeablePaged.tsx`, `QuickAccessHybrid.tsx`, `SwipeableQuickAccess.tsx`, `tileRegistry.ts` consumers
3. **Quick Actions** — `HomeQuickActions.tsx`, `QuickActionTiles.tsx`, `QuickActionRow.tsx`, `QuickActionsDrawer.tsx`, `QuickActionsPopoverMenu.tsx`, `DesktopQuickActionBar.tsx`
4. **Standalone tiles** — `MTDDeadlineTile.tsx`, `TaxEstimateTile.tsx`, `ADIBadgeTrackerTile.tsx`
5. **Dashboard widgets** — `dashboardV3/HybridDashboard.tsx`, `DashboardLayoutManager.tsx`
6. **Alternate home variants** — `BestMateHomeView`, `AppStyleHomeView`, `CleanHomeView`, `CompactHomeView`, `LockScreenHomeView`, `PremiumIOSHomeView`, `SettingsV2HomeView`, `WidgetsHomeView`, `InstructorMobileHome`

## Implementation approach

- Convert each tile's outer container from `flexDirection: "column"` to `flexDirection: "row"` with `alignItems: "center"` and `gap: 12`.
- Wrap the existing Title + Subtitle/value in a flex-column "text" block with `flex: 1, minWidth: 0` so long text truncates rather than pushing the icon.
- Badges stay top-right today; move them inline to the right edge, vertically centered (`marginLeft: "auto"`).
- Where a tile shows large numeric values stacked under the title, keep that stack inside the text block.
- Keep all colours, fonts, hover states, icon sizes, and routing untouched.

## Out of scope

- No changes to settings rows (already horizontal), navigation bars, schedule lesson rows, message rows, or the pupil/parent/school portals.
- No layout changes to desktop-only views beyond the tiles listed.
- No new icons, no copy changes.

## Risk note

This is a wide refactor — ~15 files. Each tile block is hand-styled, so the change is per-block, not a single shared component swap. I'll verify visually on the /instructor home preview after each major file.
