

## Plan: Demo Mode Toggle for Instructor Dashboard

### Overview
Add a "Demo Mode" toggle that, when enabled, injects realistic sample data into the dashboard so new instructors with no real lessons/pupils/payments can preview what a populated dashboard looks like. When toggled off, it reverts to real (empty) data.

### Architecture

**1. Create `src/context/DemoModeContext.tsx`**
- React context with `isDemoMode` boolean and `toggleDemoMode` function
- Persists state to `localStorage` so it survives refreshes
- Wraps the instructor portal

**2. Create `src/data/demoData.ts`**
- Static sample data objects matching the shapes returned by existing hooks:
  - `demoTodayOverview` — 5 lessons, 6 hours, ~£210 earnings, realistic pupil names/times
  - `demoTodayLessons` — 5 lesson entries with varied times, postcodes, statuses
  - `demoNextLesson` — next lesson in 25 minutes
  - `demoWeeklyGoals` — 22/30 hours, 18 lessons, £770 earnings
  - `demoMonthlyGoals` — 68 lessons completed, 12 scheduled
  - `demoLiveStats` — 22 hours this week, £1,540 this month
  - `demoPupils` — 8 sample pupils with names, progress, balances
  - `demoTomorrowPreview` / `demoTomorrowLessons` — 4 lessons for tomorrow
  - `demoStreak` — 12-day streak
  - `demoUnreadCount` — 3 unread messages
  - `demoPendingJobs` — 2 pending jobs

**3. Modify key hooks to respect demo mode** (approximately 8 hooks)
- `useTodayOverview`, `useTodayRemainingLessons`, `useNextLessonDetails`, `useWeeklyGoals`, `useMonthlyGoals`, `useInstructorLiveStats`, `useTomorrowLessons`, `useInstructorStreak`
- Pattern: import `useDemoMode()` context; if `isDemoMode`, return demo data immediately instead of querying the database
- No changes to actual database queries — demo mode is purely a client-side overlay

**4. Add demo mode toggle UI**
- In `InstructorMobileHome`: show a small banner/chip at the top when demo mode is active ("Viewing demo data — Tap to disable")
- In `InstructorPortal` desktop: similar banner in the status bar area
- Add a "Preview Demo Data" toggle in the settings page (`FeatureTogglesSettings`) as a local-only toggle (not saved to DB)

**5. Wrap provider in route layout**
- Add `<DemoModeProvider>` inside `InstructorPortalLayout` or at the instructor route level in `instructorPortalRoutes.tsx`

### Key Design Decisions
- Demo data is **static and client-side only** — never written to the database
- The toggle persists via localStorage, not a database column
- Interactive actions (mark complete, take payment) are disabled/no-op in demo mode with a toast saying "This is demo data"
- A subtle "DEMO" badge appears on screen so instructors don't confuse it with real data

### Files Changed
- **New**: `src/context/DemoModeContext.tsx`, `src/data/demoData.ts`
- **Modified**: ~8 hooks (add demo mode check at top), `InstructorMobileHome.tsx`, `InstructorPortal.tsx`, `FeatureTogglesSettings.tsx`, `InstructorPortalLayout.tsx` or route wrapper

