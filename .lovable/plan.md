## Context

Everything you've asked for already exists in the codebase — it's just buried behind the small "Results / Test Centres / Standards Check / Examiners" dropdown on the Test Results page. We don't need new components, dialogs, or database changes. We just need to surface the existing pieces properly on desktop.

What's already wired in `src/components/instructor/driving-test/`:

- `DrivingTestReportForm.tsx` — full DL25A-style form with **Test Centre picker**, **Examiner picker**, **Examiner took physical action** flag, and the complete competency/faults grid (driver/minor/serious/dangerous). Opens today via "Record Test" / "Mock Test" buttons.
- `ExaminerManager.tsx` — add/edit/delete examiner names and badge numbers (already on the "Examiners" tab).
- `ExaminerPicker.tsx` — used inside the form; supports inline "+ Add new examiner".
- `TestCentrePicker.tsx` — used inside the form to pick test centre.
- `StandardsCheckTrigger.tsx` — DVSA trigger-point dashboard (avg minor faults, avg serious faults, physical-action rate, pass rate vs DVSA thresholds, "Standards Check Likely" status).
- `TestCentreAnalytics.tsx` — per-centre pass rates and fault analytics.

## Plan

### 1. Replace the hidden tab dropdown with visible tab pills (desktop)
File: `src/pages/InstructorTestResults.tsx`

Swap the current `<Select>` driving `activeTab` for a horizontal pill row using existing `Tabs`/`TabsList`/`TabsTrigger` so all four sections are one click away:
- **Results** (existing list) — default
- **DVSA Triggers** (renamed from "Standards Check") — `StandardsCheckTrigger`
- **Test Centres** — `TestCentreAnalytics`
- **Examiners** — `ExaminerManager`

Style: white pill bar, `1px solid #ECEEF2`, rounded-12, active pill `#1D4ED8` on `#EEF2FF`, matching the dashboard look used on Waiting List.

### 2. Add a compact DVSA Triggers summary banner above the Results list
On the Results tab, render a slim summary card derived from the existing `StandardsCheckTrigger` logic:

```text
┌──────────────────────────────────────────────────────────────┐
│  DVSA Trigger Status   ●  0 of 4 triggers active             │
│  Pass rate 78%  ·  Avg minors 3.2  ·  Avg serious 0.1  ·     │
│  Physical action 4%                                  [View]  │
└──────────────────────────────────────────────────────────────┘
```

- Green dot + "All clear" when 0 triggers active.
- Amber dot + "Monitor closely" when 1–2.
- Red dot + "Standards Check likely" when 3+.
- "View" link jumps to the DVSA Triggers tab.

We'll lift the threshold constants and metric query out of `StandardsCheckTrigger.tsx` into a small shared hook (`useStandardsCheckMetrics`) so both the banner and the full tab share one query and one source of truth — no duplicate fetching, no logic change.

### 3. Make the existing form's coverage explicit in the empty state
The "Record first test" / "Mock Test" buttons already open `DrivingTestReportForm`, which captures test centre, examiner (with inline add), and the full faults grid. We'll just update the empty-state copy to call this out:

> "Record test centre, examiner and every fault — DL25A style."

No changes to the form itself.

### 4. Sidebar tweak
Update the sidebar label `Test Results` → `Driving Tests` (matching the breadcrumb already updated to "Driving Test Results"), and keep the current route.

## Files to change

- `src/pages/InstructorTestResults.tsx` — visible tab pills, triggers banner, empty-state copy.
- `src/components/instructor/driving-test/StandardsCheckTrigger.tsx` — extract metrics fetch into `useStandardsCheckMetrics` hook (no behaviour change).
- `src/components/instructor/driving-test/useStandardsCheckMetrics.ts` — **new** shared hook (purely a refactor of existing logic).
- `src/components/instructor/dashboardV2/DashboardSidebar.tsx` — relabel nav item.

## Out of scope / not changing

- No DB migrations — `driving_test_results`, `examiners`, `test_centres`, and `instructor_test_centres` already store everything needed.
- No changes to `DrivingTestReportForm`, `ExaminerManager`, `ExaminerPicker`, `TestCentrePicker`, `TestCentreAnalytics`.
- No mobile layout changes (per project policy).
- No changes to filters, search, export, or auth.
