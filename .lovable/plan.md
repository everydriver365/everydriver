

## Plan: Add Per-Instructor Pass Rates & DVSA Triggers to School Portal

### Overview
Extend the existing "Test Results" section (or add a new "Pass Rates & DVSA" section) in the school portal so school managers can see each instructor's pass rate and DVSA Standards Check trigger status at a glance.

### Approach
Create a new section component that loops through all `instructorIds` and renders the existing `PassRateDashboard` and `CompactStandardsCheck` components per instructor — reusing proven instructor-level code.

### Files to Create

**`src/components/school/SchoolPassRatesSection.tsx`**
- Fetches instructor names for `instructorIds`
- For each instructor, renders:
  - Instructor name header
  - `CompactStandardsCheck` tile (shows 4 DVSA trigger metrics with red/amber/green status)
  - `PassRateDashboard` component (shows pass rate gauge, trends, national average comparison)
- Includes an overall school-wide summary at the top (aggregate pass rate, number of instructors with active triggers)

### Files to Modify

1. **`src/components/school/SchoolLayout.tsx`** — Add `{ key: "pass-rates", label: "Pass Rates & DVSA", icon: Target }` to the Operations group (next to Test Results)

2. **`src/pages/SchoolPortal.tsx`** — Add `case "pass-rates"` rendering `<SchoolPassRatesSection instructorIds={instructorIds} />`

3. **`src/pages/DemoSchoolPortal.tsx`** — Same case with demo instructor IDs

### Technical Notes
- Reuses `CompactStandardsCheck` and `PassRateDashboard` directly — no duplication of DVSA logic
- Both components already accept `instructorId` as a prop and handle their own data fetching
- No database migration needed — queries existing `driving_test_results` table
- Demo mode will show "No test results recorded" per component (acceptable for demo)

