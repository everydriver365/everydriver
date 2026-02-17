

# Feature Plan: Smart Cancellation Backfill, Weather Widget, and Pass Rate Dashboard

## 1. Smart Cancellation Backfill

**What it does:** When a lesson is cancelled, the instructor gets a prompt to automatically offer that slot to pupils from their waitlist -- one tap to select pupils and send them an SMS offer.

**Implementation:**
- Create a new component `CancellationBackfillSheet.tsx` -- a bottom sheet that triggers when a lesson is cancelled
- It queries the `waitlist_entries` table for active waitlisted pupils whose preferred days/times match the cancelled slot
- Shows matched pupils with one-tap select and a "Send Offer" button that uses the existing SMS flow (via `sms:` links, same pattern as `GapFillerCard`)
- Also creates a record in `pending_slot_offers` table (already exists) so the instructor can track responses
- Hook into `CancelLessonDialog.tsx` -- after successful cancellation, show the backfill sheet with matching waitlist pupils
- No database changes needed -- uses existing `waitlist_entries` and `pending_slot_offers` tables

**Files to create:**
- `src/components/instructor/CancellationBackfillSheet.tsx`

**Files to modify:**
- `src/components/instructor/CancelLessonDialog.tsx` -- add post-cancellation backfill trigger

---

## 2. Weather Alerts Home Widget

**What it does:** A compact weather conditions card on the home screen showing current temperature, conditions, and driving-relevant warnings (ice risk, heavy rain, fog, etc.).

**Implementation:**
- Create a `WeatherWidget.tsx` component that uses the existing `currentWeather` data from `useDrivingAlerts` hook (already fetched)
- Shows: current temp, weather icon, condition description, and a colour-coded driving safety tip (e.g. "Watch for ice", "Reduced visibility")
- Compact card design matching the existing home screen tile style (gradient card pattern)
- No new API calls needed -- piggybacks on the existing `get-driving-alerts` edge function which already returns `currentWeather`
- Place it on the home screen between the hero card and the alerts strip

**Files to create:**
- `src/components/instructor/WeatherWidget.tsx`

**Files to modify:**
- `src/components/instructor/InstructorMobileHome.tsx` -- add WeatherWidget after the stats grid

---

## 3. Pass Rate Dashboard

**What it does:** A dedicated pass rate analytics view showing the instructor's overall and rolling pass rate, pass/fail breakdown by test centre and examiner, average faults, and comparison to the national average (currently ~49%).

**Implementation:**
- Create a `PassRateDashboard.tsx` component with:
  - Overall pass rate (big ring/donut chart) with national average comparison
  - Rolling 12-month pass rate trend (line chart)
  - Pass/fail breakdown by test centre (bar chart using `driving_test_results` joined with `test_centres`)
  - Average minor faults for passes vs fails
  - Top fault categories from the `faults` JSON field
- Uses existing `driving_test_results` table which already has `result`, `test_centre_id`, `examiner_id`, `total_minor_faults`, `total_serious_faults`, `total_dangerous_faults`, and `faults` JSON
- No database changes needed
- Add a new tab "Pass Rate" to the existing `InstructorPerformance.tsx` page (which already has "AI Insights" and "Metrics" tabs)

**Files to create:**
- `src/components/instructor/PassRateDashboard.tsx`

**Files to modify:**
- `src/pages/InstructorPerformance.tsx` -- add third tab for Pass Rate dashboard

---

## Technical Notes

- All three features use existing database tables and hooks -- no migrations required
- The weather widget reuses data already being fetched by `useDrivingAlerts`
- The cancellation backfill reuses the SMS pattern from `GapFillerCard`
- The pass rate dashboard uses `recharts` (already installed) for all charts
- All components follow the existing design patterns: gradient cards, motion animations, mobile-first layout

