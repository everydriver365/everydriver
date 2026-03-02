

## New "BestMate" Layout — Hybrid Homepage

A new layout option called **"BestMate"** that combines the gradient header style from the reference image with all existing dashboard functionality below it.

### What it looks like

The reference image shows:
- **Full-bleed gradient header** (dark blue) with instructor name, "Welcome" subtitle, and a branded icon on the right
- **3-column stats bar** inside the header (Weekly earnings, Monthly earnings, Schedule count) with frosted/translucent background
- **Date/time row** below header on the light background
- **Onboarding card** (setup checklist)
- **3-column feature tile grid** with white/card-colored tiles, subtle shadows, rounded corners, and colored circle icons with subtitles
- **"More Features"** horizontal scroll section
- All on a system-grouped light gray background (`#F2F2F7` / dark: `#111111`)

### Implementation plan

#### 1. Add `"bestmate"` to `LayoutStyle` type
In `src/hooks/useInstructorAppearance.ts`, extend the union type.

#### 2. Create `BestMateHomeView.tsx`
New component at `src/components/instructor/BestMateHomeView.tsx`:

- **Header section**: Full-width gradient (`rgb(38,64,97)` → `rgb(51,84,122)`, dark mode: `rgb(20,31,56)` → `rgb(26,46,82)`). Instructor name (bold, white, ~24px), "Welcome" subtitle (white/80%). Right side: Car circle icon (44px, white/90%).
- **Stats bar**: Inside header, frosted container (`rgba(255,255,255,0.15)` bg, 14px radius). 3 equal columns — Weekly earnings, Monthly earnings, Upcoming bookings count. Uses `useInstructorLiveStats` and `useWeeklyGoals` for data.
- **Date/time row**: Current date in blue (`#007AFF`), current time in secondary gray. Updates every minute.
- **Setup checklist card**: Renders `InstructorSetupChecklist` in a card style matching the image (progress ring + "Complete your onboarding").
- **Feature tiles grid**: 3-column grid replicating the image's tile styling — white card bg (`bg-card`), `rounded-[14px]`, subtle shadow, colored circle icon (50px), title (semibold), subtitle (secondary gray). Tiles: Pupils, Bookings, Finances, Messages, Job Offers, Diary — same routes and data as existing layouts.
- **More Features scroll**: Horizontal scroll row — Fuel Finder, Live Tracking, Dashboard, Settings, Add Lesson.
- **Below the grid**: All existing dashboard content (NextUpTile, TodayMiniTimeline, TodayRoutePreview, SwipeableQuickAccess, TodayLessonsList, GapFillerCard, VehicleHealthStrip, PlanWidget, FloatingSessionBar, DrivingAlertsStrip, TrackerReminderBanner).

#### 3. Wire into `InstructorMobileHome.tsx`
Add conditional branch: `layoutStyle === "bestmate"` renders `<BestMateHomeView />`.

#### 4. Add to `AppearanceSettings.tsx`
Add a "BestMate" option button with phone preview thumbnail and description "Gradient header + tiles".

### Key details
- All data hooks reused from existing views — no new data fetching
- Dark mode supported via `useTheme` for conditional header gradients and `dark:` variants on tiles/background
- Tile shading matches the reference: white cards on grouped gray background, subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
- Same touch targets, haptic feedback, and navigation as other layouts

