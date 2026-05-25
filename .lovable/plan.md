## Goal

One header across the entire instructor mobile app. The navy `HeroHeader` top row from the homepage (`MobileHomeDSM2026.tsx`) becomes the single source of truth, used on every instructor route and subroute.

## Approach

The home `HeroHeader` is actually two stacked blocks:
1. **Top bar** — navy panel with DSM logo, first name + chevron, and the Phone / Car / Bell / Menu buttons.
2. **Hero body** — `NextLessonCard` + `StatsStrip` (home-only context).

Only block 1 should be shared. Block 2 stays on home.

### Steps

1. **Extract a shared `InstructorTopBar` component** (`src/components/instructor/InstructorTopBar.tsx`) containing exactly the top row from `HeroHeader` (lines 783–820 of `MobileHomeDSM2026.tsx`). Props:
   - `firstName`, `unreadCount`, `instructorId`
   - `onPhone`, `onLiveTrack`, `onBell`, `onMenu`, `onProfile`
   - Optional `pageTitle` and `onBack` — when `onBack` is set, the DSM logo position renders a back chevron and the first-name slot becomes the page title (sub-page mode). When omitted, it renders home mode (logo + name).
   - Keeps the navy `#072b47` background, rounded bottom corners, and safe-area padding so it visually matches the home hero.

2. **Refactor `HeroHeader` in `MobileHomeDSM2026.tsx`** to render `<InstructorTopBar … />` followed by the existing `NextLessonCard` and `StatsStrip`. No visual change on home.

3. **Replace `MobileBlueHeader` in `InstructorPortalLayout.tsx`** (lines 726–742). On every non-home, non-schedule route render `<InstructorTopBar pageTitle={mobilePageTitle} onBack={…} … />` wired to the same navigation handlers (`/instructor/calls`, `/instructor/live`, `/instructor/notifications`, and the existing `setIsMobileMenuOpen` for Menu). The existing back-button logic (`isTabRoot ? navigate("/instructor") : navigate(-1)`) is preserved.

4. **Schedule page** currently also skips the header. Decide with one quick check: keep it skipped (schedule has its own chrome) or include the new bar. Default to **including** the new top bar for true consistency, unless the schedule chrome visibly conflicts — in which case leave the skip in place and note it.

5. **Leave `MobileBlueHeader.tsx` in the repo but unused** for now (don't delete in the same change — safer to verify the swap first, prune in a follow-up).

### Out of scope

- No changes to desktop layout.
- No changes to SOS / Plus / QuickActions wiring — those were `MobileBlueHeader`-specific and are not part of the home hero design. If you want them surfaced on sub-pages we can add them as optional props in a follow-up.
- No edits to existing home body, stats strip, or next-lesson card.

## Files touched

- **new** `src/components/instructor/InstructorTopBar.tsx`
- `src/components/instructor/MobileHomeDSM2026.tsx` — `HeroHeader` now composes `InstructorTopBar`
- `src/components/layout/InstructorPortalLayout.tsx` — swap `MobileBlueHeader` for `InstructorTopBar`

## Confirm before I build

- **SOS button**: the current sub-page header has an SOS button; the home header does not. Drop it from the unified header, or add SOS as a 5th icon to the home header too?
- **Schedule page**: include the unified header there as well (recommended for consistency), or keep skipped?
