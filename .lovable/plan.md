

# Add Telematics Nav Link and Marketing Page to EveryDriver Home

## Overview

Add a "Telematics" link to the top navigation bar on the EveryDriver marketing site (InstructorSaaSLayout) and create a dedicated marketing page at `/instructor-app/telematics` showcasing the telematics and driving analysis features.

## Changes

### 1. Add "Telematics" to the navigation bar

Update `src/components/layout/InstructorSaaSLayout.tsx` to add a "Telematics" nav link between "Features" and "Pricing":

```
Home | Features | Telematics | Pricing | Domains | About | Contact
```

### 2. Create the Telematics marketing page

New file: `src/pages/instructor-app/InstructorTelematics.tsx`

A dedicated page wrapped in `InstructorSaaSLayout` with:

- **Hero section** -- gradient background (matching site style), headline like "Professional-Grade Telematics for Every Lesson", subtext explaining real-time driving data and analysis
- **Feature cards** -- reusing the existing telematics features from `InstructorFeatures.tsx`:
  - Live Telematics (speed, acceleration, braking, G-force)
  - Trip Replay and Reports (animated replay, speed profile charts)
  - Driver Scoring (per-lesson scores, trend analysis)
  - Lesson Tracking and History (auto-logged trips, exportable records)
- **How It Works section** -- 3-step visual: Connect Device -> Track Lessons -> Review Data
- **Benefits for pupils section** -- parent portal visibility, safety scores, PDF reports
- **CTA section** -- "Get Started Free" button linking to signup

### 3. Register the route

Update `src/App.tsx`:
- Import `InstructorTelematics`
- Add route: `/instructor-app/telematics`

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/instructor-app/InstructorTelematics.tsx` | Full telematics marketing page |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/InstructorSaaSLayout.tsx` | Add "Telematics" to `navLinks` array |
| `src/App.tsx` | Import and register `/instructor-app/telematics` route |

No database changes required.

