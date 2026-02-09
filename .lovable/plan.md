

# App Style Layout Redesign

## Overview
Transform the "App Style" (schedule) layout option into a modern iOS-inspired mobile dashboard with glassmorphism effects, a hero image with progress overlay, and an icon-grid launcher -- matching the reference image's aesthetic.

## What Changes

### 1. New "AppStyleHomeView" Component
A brand-new component (`src/components/instructor/AppStyleHomeView.tsx`) that replaces the current `NewMobileScheduleView` when `layoutStyle === "schedule"`.

**Hero Area (top ~35% of screen):**
- Full-bleed hero image (user's custom hero or default)
- Bottom gradient overlay (dark, for text legibility)
- Large bold progress metric overlaid: e.g. `13.5h / 30h` (from `weeklyGoals` hook)
- Smaller "X hours remaining" subtitle below
- Horizontal animated progress bar under the text
- Small circular profile avatar in top-right corner area

**Glassmorphism Content Container:**
- Floating rounded-xl container sitting over the wallpaper
- Semi-transparent white background with `backdrop-blur-xl`
- Subtle border and shadow for elevation

**4-Column Icon Grid (iOS launcher style):**
- Rounded-xl icon tiles in a 4-column grid
- Each tile: rounded square with icon image (reusing existing `customIconImages` from QuickActionTiles), short label below
- Notification badges on tiles that need attention (Job Offers, Messages)
- Uses the same tile ordering/preferences system already in place (`useInstructorTilePreferences`)

### 2. Update InstructorMobileHome.tsx
- When `layoutStyle === "schedule"`, render the new `AppStyleHomeView` instead of `NewMobileScheduleView`
- Pass through all necessary props: `instructorId`, `weeklyGoals`, `heroImageUrl`, `wallpaperColor`, `pendingJobsCount`, `unreadCount`, quick actions, etc.

### 3. Update AppearanceSettings Labels
- Rename "App Style" label to "App Style" with the updated description "iOS-style launcher grid"
- Keep "Dashboard" as-is with its current preview

### 4. Visual Details
- Progress bar uses emerald/green gradient matching the reference
- Icon tiles use the existing custom PNG icons (already iOS-style)
- Text on hero auto-adapts (white text with text-shadow over the gradient overlay)
- Wallpaper color visible behind the glass container
- Smooth framer-motion animations on mount and interactions

## Technical Details

### New Files
- `src/components/instructor/AppStyleHomeView.tsx` -- the main new layout component

### Modified Files
- `src/components/instructor/InstructorMobileHome.tsx` -- swap `NewMobileScheduleView` for `AppStyleHomeView` in the schedule branch, pass additional props
- `src/components/instructor/AppearanceSettings.tsx` -- minor label update for the schedule preview description

### Dependencies Used (all already installed)
- `framer-motion` for animations
- `lucide-react` for fallback icons
- Existing `useInstructorTilePreferences`, `useWeeklyGoals`, `useUnreadMessagesCount`, `usePendingJobsCount` hooks
- Existing `customIconImages` map from `QuickActionTiles.tsx` (will export or duplicate the mapping)

### Component Structure

```text
AppStyleHomeView
+-- Hero Section (hero image + gradient overlay)
|   +-- Progress metric (hours / goal)
|   +-- Subtitle text
|   +-- Progress bar
|   +-- Profile avatar (top-right)
+-- Glass Container (backdrop-blur, rounded-xl, semi-transparent)
    +-- 4-column Icon Grid
        +-- Icon Tile (rounded-xl image + label + optional badge)
        +-- ...repeated for each visible tile
```

### Data Flow
- Weekly hours progress comes from existing `useWeeklyGoals(instructorId)` hook
- Hero image from `useInstructorAppearance` (already available in parent)
- Tile order/visibility from `useInstructorTilePreferences` (already used by QuickActionTiles)
- Badge counts from `usePendingJobsCount` and `useUnreadMessagesCount` (already available)

### Accessibility
- All text on hero uses white with text-shadow for contrast over any image
- Touch targets minimum 44x44px for icon tiles
- Notification badges use distinct colors (red) not relying on color alone (also include count number)

