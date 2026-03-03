

## Dead Links & Routing Issues Found

### 1. `/instructor/tests` — Dead Link (404)
**File:** `src/components/instructor/CleanHomeView.tsx` (line 145)
The "Tests" quick-access tile links to `/instructor/tests`, but **no such route exists** in `App.tsx`. The closest routes are `/instructor/test-results` or `/instructor/test-requests`.
**Fix:** Change path from `/instructor/tests` to `/instructor/test-results` (the DL25A test results page).

### 2. `/instructor/live-map` — Dead Link (404)
**File:** `src/components/instructor/CleanHomeView.tsx` (line 143)
The "Live Map" quick-access tile links to `/instructor/live-map`, but **no such route exists**. The correct route is `/instructor/tracking` (which renders `InstructorLiveSession`).
**Fix:** Change path from `/instructor/live-map` to `/instructor/tracking`.

**File:** `src/components/instructor/NextUpTile.tsx` (line 367)
The "Start Lesson" button navigates to `/instructor/live-map?lesson=${lessonId}` — same dead route.
**Fix:** Change to `/instructor/tracking?lesson=${lessonId}`.

### No Other Issues Found
- All routes in the Menu page (`InstructorMenu.tsx`) have valid corresponding routes in `App.tsx`
- Bottom nav links are all valid
- Learner-side mobile nav links are all valid
- Mini-website routes, SaaS marketing routes, and shared routes all resolve correctly

### Files to Modify
1. `src/components/instructor/CleanHomeView.tsx` — Fix 2 dead paths (`/instructor/tests` → `/instructor/test-results`, `/instructor/live-map` → `/instructor/tracking`)
2. `src/components/instructor/NextUpTile.tsx` — Fix 1 dead path (`/instructor/live-map` → `/instructor/tracking`)

