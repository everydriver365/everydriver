

# Redesign Instructor Mobile Home Page

## Overview
Redesign the instructor mobile home page to match the reference mockup -- a full-bleed hero image with overlaid weekly progress stats, a compact "Next Lesson" card, a 4-column iOS-style icon grid, and a bottom navigation bar. All data (tiles, next lesson, stats) will remain functional and connected to live data.

## Visual Changes

### 1. Hero Section (ContextualHomeHero)
- **Full-bleed hero image** covering the top portion of the screen (approx 45-50vh)
- **Weekly hours progress** overlaid on the hero image in large bold white text: "13.5h / 30h" format with a green progress bar underneath
- **"X hours remaining"** subtitle below the progress bar
- Remove the current white overlapping card -- stats are rendered directly on the hero image with a dark gradient overlay for readability
- Instructor profile avatar cluster in top-right corner

### 2. Next Lesson Card (Compact Overlay)
- Redesigned as a compact, frosted-glass/white rounded pill overlapping the bottom of the hero
- Shows: pupil avatar, "Next Lesson", time, duration, amount owed, pickup postcode
- Chevron right indicator for tap-to-expand
- Uses existing `useNextLessonDetails` data (pupilName, startTime, minutesUntil, accountBalance, pickupPostcode)

### 3. Quick Action Tiles (4-Column Grid)
- Change from current 2-column oblong layout to a **4-column square icon grid** matching the reference
- Each tile: large square icon (using existing custom icon images), label underneath
- Tiles: Today, Job Offers (with badge), Messages, Wallet, Track Lesson, Sat Nav, Take Payment, Availability, Find My Car, Find Fuel, Health Hub, Resources
- Uses existing `QuickActionTiles` component data and preferences system
- Scrollable/paginated with dot indicators if more than 12 tiles

### 4. Bottom Navigation
- Keep existing 6-tab bottom nav (Home, Schedule, Track, Money, Pupils, More) -- already matches reference closely

## Technical Details

### Files to Modify
1. **`src/components/instructor/ContextualHomeHero.tsx`** -- Redesign to full-bleed hero with overlaid progress stats (white text on dark gradient), remove the overlapping white card
2. **`src/components/instructor/InstructorMobileHome.tsx`** -- Update layout flow: hero -> compact next lesson -> 4-col tiles -> insights. Remove section labels and spacing that don't match reference
3. **`src/components/instructor/QuickActionTiles.tsx`** -- Change normal view from 2-column oblongs to 4-column square grid with icon on top, label below (iOS app icon style)
4. **`src/components/instructor/NextUpTile.tsx`** -- Add a new "compact" variant prop that renders the condensed single-line card shown in the reference (avatar + time + duration + balance + postcode)

### Data Sources (All Existing)
- Weekly hours/goal: `useWeeklyGoals` hook (hoursThisWeek, hoursGoal, progressPercent)
- Next lesson: `useNextLessonDetails` hook (pupilName, startTime, minutesUntil, accountBalance, pickupPostcode)
- Quick action tiles: `useInstructorHomepageContent` + `useInstructorTilePreferences`
- Tile badges: `usePendingJobsCount`, `useUnreadMessagesCount`
- Traffic/ETA: `useTrafficETA` hook (already integrated)
- Weather: `useDrivingAlerts` hook (already integrated)

### Approach
- First create a **demo page** at `/instructor-mobile-demo` showing the new layout with the same live data hooks so you can preview before replacing the real home page
- Once approved, swap into the actual `InstructorMobileHome` component
- The 4-column tile grid will reuse all existing custom icon images and tile preference/ordering logic
- Background: soft blue gradient (`bg-[#E8F1FE]`) is kept as the page background, matching the reference's light blue feel

