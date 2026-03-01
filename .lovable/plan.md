

# Plan: Redesign Instructor Mobile Homepage

This is a comprehensive redesign of `InstructorMobileHome.tsx` and its child components to match the exact iOS-inspired specification provided. The existing component is ~820 lines and already implements most of the data hooks and business logic — the changes are primarily visual/layout restructuring.

## What Changes

### 1. New Hero Banner Component (`HomepageHero.tsx`)
Replace the current hero (220px image + gradient overlay + Today's Overview card) with the specified design:
- 160px height, `rounded-b-[20px]`, full-bleed driving image with `bg-gradient-to-r from-primary/80 via-primary/50 to-transparent` overlay
- Safe-area-inset-top padding for notched phones
- Bottom-left: time-aware greeting (28px bold white) + date (14px white/70, "Monday 3 March" format)
- Overlapping "This Week" card at `-mt-4 mx-4 z-10`: white/80 backdrop-blur-xl, 20px radius, shadow
  - Left: "THIS WEEK" label (11px bold uppercase teal-600), motivational subtitle (18px semibold), "{N} lessons scheduled" (14px muted)
  - Right: SVG progress ring (64×64, radius 26, stroke 6, teal `#0d9488`), animated arc, center shows completed/total

### 2. New Activity Tiles Grid (`ActivityTilesGrid.tsx`)
Replace the current vertical notification cards (Job Offers, Messages, Test Requests) with a 2×2 grid:
- `px-4 mt-4 grid grid-cols-2 gap-3`
- Each tile: white bg, 14px radius, 14px padding, shadow `0 1px 4px rgba(0,0,0,0.06)`
- Top row: 36×36 rounded-[10px] icon container (12% opacity tint) left, 28px bold animated count right
- Below: 15px semibold title, 12px muted subtitle
- Four tiles with specified accent colors:
  - Job Offers (#AF52DE), Messages (#FF9500, Mail icon), Test Requests (#5AC8FA, CheckCircle), Fill Gaps (#FF2D55, Calendar)
- Uses existing `usePendingJobsCount`, `useUnreadMessagesCount`, gap slots hooks
- Animated counter component for count numbers

### 3. Redesigned "Your Day" Section
Keep existing `NextUpTile` and `TodayMiniTimeline` but update styling:
- Section label: 13px semibold uppercase tracking-wide muted
- `TodayMiniTimeline` cards: update border-left colors to match spec (#007AFF Standard, #FF9500 Test Prep, #AF52DE Mock Test, #FF2D55 Motorway)

### 4. New "Quick Access" Swipeable Grid (`SwipeableQuickAccess.tsx`)
Replace the current 2-column `QuickActionTiles` with an Embla Carousel paginated grid:
- 6 tiles per page (2 cols × 3 rows)
- Each tile: 110px height, 16px padding, white bg, 16px radius, border `#F0F0F4`, shadow
- Layout: title (16px bold #1C1C1E) + subtitle (13px #8E8E93) top-left, 30px Lucide icon bottom-right (per-tile accent color, strokeWidth 1.6)
- Spring tap animation: scale 0.96, stiffness 400, damping 25
- Pagination dots: inactive = 7px circle #E5E5EA, active = 20px pill #142040, radius 3.5px, transition 0.3s
- ~21 tiles defined with specific accent colors per tile
- Preserves existing tile preference hooks for ordering/visibility

### 5. "Today's Lessons" Full List Section
New section below Quick Access:
- Header: 18px bold + count badge (14px semibold #AEAEB2, bg #F0F0F4, rounded-[10px])
- Empty state: white card, CalendarOff icon, "No lessons today", "Enjoy your day off!"
- Lesson cards: white bg, 14px radius, shadow, 4px left border (color-coded by type), cancelled at 50% opacity
- Card contents: time + Clock icon, lesson type badge (colored bg 10% opacity), pupil name 16px semibold, notes, amount, status badges

### 6. Update `InstructorMobileHome.tsx`
Restructure the main component to compose the new sub-components in the specified order:
1. HomepageHero
2. ActivityTilesGrid
3. Conditional alerts/tracker reminder (existing)
4. "Your Day" section (NextUpTile + TodayMiniTimeline)
5. TodayRoutePreview (existing)
6. GapFillerCard (existing)
7. SwipeableQuickAccess
8. Today's Lessons full list
9. VehicleHealthStrip (existing)
10. Existing global features (PullToRefresh, FloatingSessionBar, CelebrationConfetti, RadialFAB, UrgentAlertOverlay)

All existing data-fetching hooks and business logic remain unchanged — this is a UI restructuring.

## Files to Create
- `src/components/instructor/HomepageHero.tsx` — new hero banner
- `src/components/instructor/ActivityTilesGrid.tsx` — 2×2 activity tiles
- `src/components/instructor/SwipeableQuickAccess.tsx` — Embla carousel paginated grid
- `src/components/instructor/TodayLessonsList.tsx` — full today's lessons list with empty state

## Files to Modify
- `src/components/instructor/InstructorMobileHome.tsx` — restructure default layout to compose new components
- `src/components/instructor/TodayMiniTimeline.tsx` — update border-left colors to match spec

## Dependencies
- `embla-carousel-react` (already installed) for swipeable Quick Access
- All other dependencies already available (framer-motion, lucide-react, date-fns)

## Technical Notes
- The `AnimatedCounter` component already exists at `src/components/ui/AnimatedCounter.tsx` — reuse for activity tile counts
- Existing hooks (`useTodayOverview`, `useWeeklyGoals`, `usePendingJobsCount`, `useUnreadMessagesCount`, `useRealGapSlots`, `useTodayRemainingLessons`) provide all required data
- The 4 alternate layout styles (app/lockscreen/clean) remain untouched — changes only affect the default "dashboard" layout
- Safe-area-inset handled via `env(safe-area-inset-top)` CSS

