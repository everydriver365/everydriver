

# Add Earnings Forecast Widget to Instructor Home Screen

## What changes

Add the existing `EarningsForecaster` component (currently only visible on the Pay page) to the instructor mobile home screen, positioned in the "Plan Ahead" section alongside the Tomorrow Peek card.

## Technical details

**File to modify:** `src/components/instructor/InstructorMobileHome.tsx`

1. Import the existing `EarningsForecaster` component at the top of the file
2. Add it in the "PLAN AHEAD" section (around line 584), just after the Tomorrow Peek card and before the Road Alerts row
3. Only render when `instructorId` is available (same guard pattern used for other widgets)

No new files, no database changes, no new components needed -- just wiring up the existing widget in a new location.

