
# Google Calendar-Style Schedule View for Diary

## Overview

This plan adds a new "Schedule" view option to the Instructor Schedule page that mimics Google Calendar's agenda/schedule layout shown in your reference image. This provides a scrollable, date-grouped view with color-coded events, month separators, and the ability to customize event colors.

## Key Features to Implement

### 1. New Schedule View Component
A new `GoogleStyleScheduleView` component that displays:
- Vertical scrolling list organized by date
- Day labels on the left (e.g., "SUN 1", "MON 2")
- Week range headers (e.g., "FEBRUARY 2 - 8")  
- Colored event bars spanning the width
- Month header banners between months (e.g., "February" with decorative styling)

### 2. View Mode Toggle Enhancement
Add a third view option "Schedule" alongside existing "List" and "Calendar" options to provide the Google Calendar-style agenda view.

### 3. Per-Event Color Customization
Extend the existing color system to allow:
- Default colors by event type (lessons, blocks, external)
- Individual lesson color overrides (stored per lesson)
- Quick color picker when clicking/editing an event

## Technical Implementation

### Files to Create

**`src/components/instructor/GoogleStyleScheduleView.tsx`**
```text
New component featuring:
- useInstructorCalendar hook for data
- Date range spanning multiple weeks/months
- Grouped rendering by day with week headers
- Month banner separators with decorative styling
- Color-coded event bars matching the reference image
- Click handlers for event details
- Infinite scroll or load-more pattern for date ranges
```

### Files to Modify

**`src/pages/InstructorSchedule.tsx`**
- Add "Schedule" as third view mode option
- Import and render new GoogleStyleScheduleView
- Update toggle button group with 3 options

**`src/components/instructor/CalendarColorSettings.tsx`**
- Add section for custom color categories/labels
- Allow naming custom colors for different event types
- Save to instructor settings

**`src/hooks/useInstructorCalendar.ts`**
- Extend date range fetching for schedule view (load 2-3 months at a time)
- Add function to update individual event colors

### Database Schema (Optional Enhancement)
- Add `color_override` column to `scheduled_lessons` table for per-lesson colors
- Add `event_categories` JSON column to `instructors` table for custom category definitions

## Visual Design

### Schedule Layout Structure
```text
+-------------------------------------------+
| FEBRUARY                          [banner] |
+-------------------------------------------+
| SUN  | [=== Spring term (Day 28/82) ===] |
|  1   | [=== 1/2/26 - 9am - WDU... ====]  |
|      |     09:00 - 12:00 at https://...   |
+------+------------------------------------+
| FEBRUARY 2 - 8                    [header] |
+------+------------------------------------+
| MON  | [=== Lotty: No College =======]   |  <- Yellow
|  2   | [=== Spring term (Day 29/82) =]   |  <- Blue
|      | [=== 2/2/26 - WDU - 2pm... ====]  |
+------+------------------------------------+
```

### Color System
- Events use existing `calendarColors` from instructor settings
- Lessons show as configured lesson color (paid/unpaid)
- Personal events show as block color
- External calendar events show as external color
- Individual events can override with custom color

### Mobile Optimized
- Compact date column on left
- Full-width event bars
- Touch-friendly tap targets
- Smooth scrolling through dates

## Implementation Phases

### Phase 1: Core Schedule View
- Create GoogleStyleScheduleView component
- Render events grouped by day
- Add week range headers
- Add month separator banners
- Wire up to existing useInstructorCalendar hook

### Phase 2: View Toggle Integration
- Add "Schedule" option to view mode selector
- Persist preference to localStorage
- Handle responsive behavior (default to schedule on mobile if preferred)

### Phase 3: Enhanced Color Customization
- Event detail sheet shows color picker
- Save color overrides per event
- Create named color categories for common event types

## Expected Outcome

Instructors will have three view options:
1. **List** - Daily lesson cards with quick actions (existing)
2. **Calendar** - Week/month grid view (existing)  
3. **Schedule** - Google Calendar-style scrolling agenda (new)

The schedule view provides an at-a-glance view of upcoming commitments with visual color coding, making it easy to see busy periods and plan availability.
