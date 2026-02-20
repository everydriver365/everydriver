

# Enhanced Clean Dashboard - Full Driving Instructor Management Dashboard

## Overview

Upgrade the existing "Clean" layout option to become a full-featured, self-contained dashboard matching the requested design specification. This uses the specified color palette and introduces the missing UI elements (Upcoming Tests section, enhanced lesson cards with type badges/paid status) while leveraging all existing data hooks and backend infrastructure.

## What Already Exists (No Backend Changes Needed)

The project already has all the database tables, hooks, and pages required:

- **Today/Home**: `CleanHomeView.tsx` (greeting, stats, schedule) -- needs enhancement
- **Pupils**: `/instructor/pupils` with full CRUD, search, detail views
- **Schedule**: `/instructor/schedule` + `/instructor/diary` with week strip, Google Calendar sync
- **Live Map**: `/instructor/live` with GPS tracking, speed HUD, session recording, route polylines
- **More**: `/instructor/menu` with payments, test results, settings, etc.

**No new database tables or backend changes are needed.** All data models (pupils, lessons, payments, driving tests, GPS sessions) already exist.

## Changes Required

### 1. Enhanced `CleanHomeView.tsx` (Major Update)

The current Clean view only has a greeting, 2x2 stats grid, and basic schedule list. Upgrade it to include:

**a) Color scheme override** -- Apply the requested palette via CSS custom properties scoped to the clean layout:
- Primary: `#1B4965`, Background: `#F5F7FA`, Cards: `#FFFFFF` with `#E8ECF0` borders
- Success: `#10B981`, Warning: `#F0A500`, Danger: `#EF4444`

**b) Enhanced stat cards** -- Keep the 2x2 grid but add the specified accent colors per card (teal for lessons, blue for pupils, green for earnings, amber for outstanding)

**c) Today's Schedule section** -- Upgrade lesson cards to show:
- Pupil name, time range, lesson type badge (color-coded: Standard blue, Test Prep amber, Mock Test purple, Motorway green, Refresher pink)
- Pickup address, price, and paid/unpaid status badge
- Uses existing `useTodayRemainingLessons` hook + enrich with lesson type data from `scheduled_lessons`

**d) Upcoming Tests section** -- New section below schedule showing upcoming tests:
- Date badge, pupil name, time, test centre
- Urgency indicator (red pulse) for tests within 7 days
- Uses existing test data from `driving_tests` table

**e) Quick navigation bar** -- Bottom nav within the clean view linking to Pupils, Schedule, Live Map, and More pages (these pages already exist)

### 2. Update `useTodayRemainingLessons.ts` hook

Add `lesson_type`, `hourly_rate`, and `payment_status` fields to the query so the Clean view can display type badges and paid/unpaid status on lesson cards.

### 3. New hook: `useUpcomingTests.ts`

Simple query hook to fetch upcoming driving tests for the instructor's pupils, ordered by date. Returns test date, pupil name, time, test centre, test type, and calculates urgency (within 7 days).

### 4. Scoped color theme

Add a CSS class `.clean-dashboard-theme` that overrides the card borders, backgrounds, and accent colors to match the specified palette, applied only when the Clean layout is active.

## Design Details

### Lesson Card Layout (within Clean view)
```text
+------------------------------------------+
| [color bar]  John Smith         [Standard]|
|              09:00 - 10:00               |
|   pin  BS1 4DJ                           |
|   GBP  L35.00            [Paid] or [Due] |
+------------------------------------------+
```

### Upcoming Test Card Layout
```text
+------------------------------------------+
| [MAR]                                    |
| [ 15]  Sarah Jones                       |
|        09:30 - Bristol (Southmead)       |
|        Practical          [! 5 days]     |
+------------------------------------------+
```

### Stat Cards (2x2)
- Today's Lessons: count, teal accent icon
- Active Pupils: count, blue accent icon  
- This Month: GBP earnings, green accent icon
- Outstanding: GBP owed, amber/red accent icon

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/instructor/CleanHomeView.tsx` | Major update | Add type badges, paid status, upcoming tests, enhanced styling |
| `src/hooks/useTodayRemainingLessons.ts` | Update | Add lesson_type, hourly_rate, payment_status to query |
| `src/hooks/useUpcomingTests.ts` | Create | New hook for upcoming driving tests |
| `src/index.css` | Minor update | Add `.clean-dashboard-theme` scoped color overrides |

## What This Does NOT Change

- All existing pages (Pupils, Schedule, Live Map, More/Menu) remain unchanged -- the Clean view links to them
- No database migrations needed
- No new routes needed
- Other layout options (Default, App Style, Lock Screen) are untouched
- All 15+ existing data hooks continue to work identically

