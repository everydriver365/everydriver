
# Phase 1: Instructor Health & Wellness Hub - Implementation Plan

## Overview

This plan introduces a comprehensive health tracking system designed specifically for driving instructors, addressing the occupational health challenges of extended sedentary work. The system includes weight logging, water intake tracking, curated health tips, and smart break reminders synchronized with the lesson schedule.

---

## What You Will Get

### 1. Health Dashboard
A dedicated health hub accessible from the instructor menu with:
- Daily weight logging with trend visualization (line chart)
- Water intake tracker with glass-by-glass logging and daily goal
- Personalized daily health tips for driving instructors
- Weekly summary cards showing progress

### 2. Smart Break Reminders
Intelligent reminders that:
- Analyze your lesson schedule to find gaps
- Suggest optimal break times between lessons
- Provide stretch/hydration micro-exercises
- Appear as non-intrusive notifications or home page widgets

### 3. Health Tips Feed
Rotating health content including:
- Posture correction exercises
- Eye strain reduction techniques
- Hydration reminders
- Stress management for instructors
- Quick stretches you can do at the car

---

## Technical Details

### Database Schema

**New Tables:**

```text
instructor_health_logs
+------------------+-------------+----------------------------+
| Column           | Type        | Description                |
+------------------+-------------+----------------------------+
| id               | uuid        | Primary key                |
| instructor_id    | uuid        | Foreign key to instructors |
| log_date         | date        | Date of entry              |
| weight_kg        | decimal     | Weight in kilograms        |
| notes            | text        | Optional notes             |
| created_at       | timestamp   | Record creation time       |
+------------------+-------------+----------------------------+

instructor_water_logs
+------------------+-------------+----------------------------+
| Column           | Type        | Description                |
+------------------+-------------+----------------------------+
| id               | uuid        | Primary key                |
| instructor_id    | uuid        | Foreign key to instructors |
| log_date         | date        | Date of entry              |
| glasses_count    | integer     | Number of glasses (250ml)  |
| daily_goal       | integer     | Target glasses (default 8) |
| created_at       | timestamp   | Record creation time       |
| updated_at       | timestamp   | Last update time           |
+------------------+-------------+----------------------------+

instructor_health_settings
+------------------+-------------+----------------------------+
| Column           | Type        | Description                |
+------------------+-------------+----------------------------+
| id               | uuid        | Primary key                |
| instructor_id    | uuid        | Foreign key to instructors |
| weight_unit      | text        | 'kg' or 'lbs'              |
| daily_water_goal | integer     | Target glasses per day     |
| break_reminder   | boolean     | Enable break reminders     |
| reminder_interval| integer     | Minutes between reminders  |
| created_at       | timestamp   | Record creation time       |
| updated_at       | timestamp   | Last update time           |
+------------------+-------------+----------------------------+

health_tips
+------------------+-------------+----------------------------+
| Column           | Type        | Description                |
+------------------+-------------+----------------------------+
| id               | uuid        | Primary key                |
| category         | text        | posture/hydration/eyes/etc |
| title            | text        | Tip headline               |
| content          | text        | Full tip content           |
| icon             | text        | Lucide icon name           |
| display_order    | integer     | Sort order                 |
| is_active        | boolean     | Show/hide tip              |
| created_at       | timestamp   | Record creation time       |
+------------------+-------------+----------------------------+
```

### New Components

| Component | Purpose |
|-----------|---------|
| `HealthDashboard.tsx` | Main health hub page with tabs for weight, water, tips |
| `WeightTracker.tsx` | Log weight entries with chart visualization using recharts |
| `WaterIntakeTracker.tsx` | Interactive glass counter with daily progress ring |
| `HealthTipCard.tsx` | Individual tip display with icon and category badge |
| `BreakReminderWidget.tsx` | Home page widget suggesting break times |
| `HealthSettingsPanel.tsx` | Configure units, goals, and reminder preferences |

### New Hook

| Hook | Purpose |
|------|---------|
| `useInstructorHealth.ts` | Centralized health data fetching, logging, and real-time updates |
| `useBreakReminders.ts` | Calculate optimal break times from schedule gaps |

### New Page Route

| Route | Component |
|-------|-----------|
| `/instructor/health` | Health Dashboard page |

---

## Implementation Steps

### Step 1: Database Setup
- Create the four new tables with appropriate RLS policies
- Seed the `health_tips` table with 20+ curated tips for driving instructors
- Add realtime publication for water logs (live updates)

### Step 2: Health Settings & Hook
- Create `useInstructorHealth` hook for CRUD operations
- Implement settings management for units and goals

### Step 3: Weight Tracker Component
- Build weight logging form with date picker
- Implement line chart showing 30-day trend using recharts
- Calculate and display weekly/monthly averages

### Step 4: Water Intake Tracker
- Create interactive glass icons (tap to add)
- Build circular progress indicator matching existing "lessons today" style
- Add quick-add buttons (+1, +2 glasses)

### Step 5: Health Tips Feed
- Create tip card component with category filtering
- Implement "tip of the day" rotation logic
- Add pull-to-refresh on mobile

### Step 6: Break Reminder System
- Build `useBreakReminders` hook that:
  - Fetches today's scheduled lessons
  - Identifies gaps of 30+ minutes
  - Suggests break activities
- Create home page widget showing next suggested break
- Optionally integrate with existing push notification system

### Step 7: Menu & Navigation
- Add "Health" item to the instructor menu under a new "Wellbeing" section
- Use Heart icon with pink/rose color scheme

### Step 8: Home Page Widget
- Add compact health summary widget to `InstructorMobileHome`
- Show today's water progress and next break time

---

## Design Approach

### Visual Style
- Follows existing Arlo-style design system
- Uses rose/pink color palette for health features (differentiates from business tools)
- Consistent card styling with existing components like `VehicleHealthManager`
- Mobile-first responsive design

### User Experience
- Non-intrusive: health features are opt-in and don't interrupt workflow
- Quick logging: single tap to log water, two taps to log weight
- Motivational: encouraging messages and progress visualization
- Contextual: break suggestions tied to actual schedule

---

## Files to Create

| File Path | Description |
|-----------|-------------|
| `src/pages/InstructorHealth.tsx` | Main health dashboard page |
| `src/components/instructor/health/WeightTracker.tsx` | Weight logging and chart |
| `src/components/instructor/health/WaterIntakeTracker.tsx` | Water tracking UI |
| `src/components/instructor/health/HealthTipCard.tsx` | Individual tip display |
| `src/components/instructor/health/HealthTipsFeed.tsx` | Tips list with categories |
| `src/components/instructor/health/BreakReminderWidget.tsx` | Break suggestion widget |
| `src/components/instructor/health/HealthSettingsPanel.tsx` | Health preferences |
| `src/hooks/useInstructorHealth.ts` | Health data management hook |
| `src/hooks/useBreakReminders.ts` | Schedule-based break suggestions |

## Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/pages/InstructorMenu.tsx` | Add "Health" menu item |
| `src/components/instructor/InstructorMobileHome.tsx` | Add health summary widget |
| `src/App.tsx` (or router file) | Add `/instructor/health` route |

---

## Sample Health Tips (Pre-seeded)

| Category | Example Tips |
|----------|--------------|
| Posture | "Adjust your seat between lessons - even small changes reduce pressure points" |
| Hydration | "Keep a water bottle in your cup holder - aim for a sip every 15 minutes" |
| Eyes | "Follow the 20-20-20 rule: every 20 mins, look 20 feet away for 20 seconds" |
| Movement | "During a break, walk around your car once - it takes 30 seconds and helps circulation" |
| Stress | "Use the 4-7-8 breathing technique between pupils: inhale 4s, hold 7s, exhale 8s" |

---

## Future Considerations (Phase 2+)

This Phase 1 implementation sets the foundation for:
- Step counting via Device Motion API or manual entry
- Achievement badges (7-day streak, weight goal reached)
- Apple Health / HealthKit integration (requires Capacitor native build)
- Community challenges between instructors
- Integration with telematics for "hours seated" tracking
