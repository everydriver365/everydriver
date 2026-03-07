

## Plan: Month-End Summary Tile + Review Page

### Overview
Add a "Month End" tile to Quick Access that opens a dedicated review page. The page aggregates the current month's key metrics into an editable summary that the instructor can review, adjust, and then export to their accounting platform (Xero, QuickBooks, FreeAgent, Sage).

### Changes

**1. Add "Month End" tile to `SwipeableQuickAccess.tsx`**
- New entry in `ALL_TILES`: title "Month End", subtitle "Review & submit", icon `FileBarChart`, accent `#5856D6`, route `/instructor/month-end`

**2. Move Weekly Report & Outstanding Tasks into Quick Access tiles** (from the approved prior plan)
- Add "Weekly Report" tile (icon `BarChart3`, route `/instructor/weekly-report`)
- Add "Tasks Due" tile (icon `ClipboardList`, route `/instructor/outstanding-tasks`)
- Remove standalone `<WeeklyReportCard>` and `<OutstandingTasksCard>` from `InstructorMobileHome.tsx`, `BestMateHomeView.tsx`, and `CompactHomeView.tsx`
- Create simple wrapper pages for `/instructor/weekly-report` and `/instructor/outstanding-tasks`

**3. Create `MonthEndReview` page component** (`src/pages/instructor/MonthEndReview.tsx`)
- Fetches and displays for the selected month:
  - **Earnings**: total from `payment_history` + completed lesson amounts
  - **Lessons Completed**: count from `scheduled_lessons` where status = completed
  - **Tests**: count from test results for the month
  - **Lessons Cancelled**: count from `scheduled_lessons` where status = cancelled
  - **Expenses**: total from `instructor_expenses`, with category breakdown
  - **DVSA Triggers**: count/summary from `standards_check` data
- Each section shown as an editable card — instructor can adjust amounts/notes before finalizing
- "Submit to Accounting" button at the bottom triggers the existing `AccountingExport` CSV generation logic for the chosen platform (Xero/QuickBooks/FreeAgent/Sage)
- Platform selector (tabs) reuses the pattern from `AccountingExport.tsx`

**4. Add route in `App.tsx`**
- Lazy import `MonthEndReview` page
- Route: `/instructor/month-end`

### Data Sources (all existing tables, no migrations needed)
- `scheduled_lessons` — lessons completed/cancelled counts, earnings
- `payment_history` — month earnings
- `instructor_expenses` — expenses total + breakdown
- `accounting-export/platformConfigs.ts` — CSV formatting for submission
- Standards check / DVSA trigger data from existing tables

### UI Design
- Mobile-first card layout matching existing instructor pages
- Summary cards at top with key figures (earnings, lessons, tests, cancellations, expenses, DVSA triggers)
- Each card is tappable to expand/edit the value with a note field
- Bottom action: platform selector + "Download for [Platform]" button
- Month picker at top to select which month to review

