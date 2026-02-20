
# Implementing the Lock Screen iOS Design as the Instructor Homepage

## Overview

Adapt the Lock Screen aesthetic (Design 3 from the iOS Demo 3) as a new layout option for the instructor mobile homepage, while retaining **every** existing feature and data hook. The Lock Screen demo currently only shows a clock, 3 static notification cards, and 2 quick action circles — we need to expand it to house all 20+ widgets and data sources the current homepage uses.

## Current Functionality to Retain

The existing `InstructorMobileHome` component includes all of the following, which must be preserved:

1. **Data hooks** (15+): today overview, next lesson, unread messages, pending jobs, driving alerts, GPS status, weekly goals, streak, tomorrow preview, gap suggestions, today's remaining lessons, last week comparison, urgent alerts, weather, offline sync
2. **Greeting + profile** (avatar, name, online/offline status, weather)
3. **Stats grid** (lessons, earnings, weekly %, next lesson time)
4. **Job Offers tile** (with badge count)
5. **Messages tile** (with unread count)
6. **Test Requests tile**
7. **Driving alerts strip** (weather/traffic)
8. **Check Engine banner**
9. **Tracker reminder banner**
10. **Next Up lesson card** (with navigation, call, balance info)
11. **Today Mini Timeline** (remaining lessons)
12. **Today Route Preview** (map)
13. **Quick Action Tiles** (16 icons, reorderable, with edit mode)
14. **Vehicle Health strip**
15. **Unified Agenda tile** (tasks + reminders)
16. **Plan widget**
17. **Tomorrow Peek card**
18. **Earnings Forecast**
19. **Road Alerts row**
20. **Setup Checklist** (for new instructors)
21. **Floating Session bar** (active tracking)
22. **Radial FAB** (scroll-triggered)
23. **Pull to refresh**
24. **Celebration confetti**
25. **Urgent alert overlay**

## Proposed Lock Screen Layout Design

The Lock Screen aesthetic features a dark gradient background, large clock, and frosted-glass notification cards. Here's how we map all features into this visual language:

### Section-by-section layout (top to bottom)

```text
+------------------------------------------+
| [Header bar - existing InstructorMobile  |
|  Header component, unchanged]            |
+------------------------------------------+
| Dark gradient background (#1a1a2e ->     |
| #16213e -> #0f3460)                      |
|                                          |
|  Date (e.g. "Thursday, 20 February")     |
|  Time (72px thin font, live clock)       |
|  Weather pill (temp + icon + location)   |
|  GPS status dot                          |
|                                          |
| --- Urgent Alert Overlay (if any) ---    |
|                                          |
| [Frosted notification stack]             |
|  - Driving alerts (weather/traffic)      |
|  - Check Engine banner                   |
|  - Tracker reminder                      |
|                                          |
| [Next Lesson "notification"]             |
|  Frosted glass card showing:             |
|  - Pupil name, time, postcode            |
|  - Duration, balance, call/navigate btns |
|  (Taps through to full NextUpTile)       |
|                                          |
| [Stats notification card]                |
|  - 2x2 grid: lessons, earnings,          |
|    weekly %, streak                      |
|                                          |
| [Messages notification card]             |
|  - Unread count, tap to navigate         |
|                                          |
| [Job Offers notification card]           |
|  - Pending count, tap to navigate        |
|                                          |
| [Test Requests notification card]        |
|                                          |
| --- YOUR DAY section label ---           |
|                                          |
| [Today Mini Timeline]                    |
|  (frosted glass container)               |
|                                          |
| [Today Route Preview]                    |
|  (frosted glass container)               |
|                                          |
| --- QUICK ACTIONS section ---            |
|                                          |
| [Quick Action Tiles grid]                |
|  4-col grid, icons with white labels     |
|  (same reorderable tiles, just white     |
|   text and frosted icon backgrounds)     |
|                                          |
| --- MORE section ---                     |
|                                          |
| [Vehicle Health strip]                   |
| [Unified Agenda tile]                    |
| [Plan widget]                            |
|                                          |
| --- PLAN AHEAD section ---              |
|                                          |
| [Tomorrow Peek card]                     |
| [Earnings Forecast]                      |
| [Road Alerts row]                        |
| [Setup Checklist]                        |
|                                          |
| [Floating Session Bar]                   |
+------------------------------------------+
```

### Key visual adaptations

- **Background**: Replace white/wallpaper with dark gradient
- **Cards**: All existing card components wrapped in frosted-glass containers (`backdrop-blur-xl`, `bg-white/10-15`, `rounded-[14px]`)
- **Text**: All labels switch to white/white-alpha
- **Section labels**: Uppercase, `text-white/50`, matching iOS lock screen grouping
- **Existing components** (NextUpTile, QuickActionTiles, TodayMiniTimeline, etc.) are rendered inside styled wrappers — their internal logic is untouched

## Technical Plan

### 1. New component: `src/components/instructor/LockScreenHomeView.tsx`

- Accepts the same props as the current inline layout in `InstructorMobileHome`
- Renders the dark gradient background with clock header
- Wraps each existing component (NextUpTile, QuickActionTiles, TestRequestsTile, etc.) in frosted-glass card containers
- Uses all the same hooks and data that `InstructorMobileHome` already fetches (passed as props or accessed from context)

### 2. Update `src/components/instructor/InstructorMobileHome.tsx`

- Add a third layout option alongside existing `"schedule"` (App Style) and default
- When `layoutStyle === "lockscreen"`, render `LockScreenHomeView` instead
- Pass all existing data (nextLesson, todayOverview, weeklyGoals, alerts, etc.) as props

### 3. Update `src/hooks/useInstructorAppearance.ts`

- Extend the `layoutStyle` type to include `"lockscreen"` as a valid option
- This allows instructors to select the Lock Screen layout from Settings

### 4. Update Settings UI

- Add "Lock Screen" as a third layout option in the instructor appearance/settings page where "Default" and "App Style" are already selectable

### No database or backend changes required

The layout preference is already stored in the instructor's settings — we're just adding a new valid value.

## What stays exactly the same

- All data fetching hooks (no changes)
- InstructorMobileHeader (no changes)
- Bottom navigation (no changes)
- All tile/widget components internally (NextUpTile, QuickActionTiles, etc.)
- Pull to refresh, confetti, urgent alerts, floating session bar
- Tile reordering and edit mode
- All navigation routes and click handlers
