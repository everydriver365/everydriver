

## Plan: Ensure All Live Data Across the Platform — Remove Hardcoded & Demo Fallbacks

### Summary

Audit found **3 categories** of issues: (A) demo mode returning fake data instead of live queries, (B) hardcoded stats on public-facing pages, and (C) placeholder "coming soon" features that should either work or be removed. Demo pages (`/demo/*`) are excluded — those are design exploration pages with intentionally static content.

### Category A: Demo Mode Fake Data (8 hooks)

These hooks return hardcoded demo data from `src/data/demoData.ts` when `isDemoMode` is true. The fix is to **remove all demo mode branches** so they always query live data, then delete the demo data file and context.

| Hook | Demo Return |
|------|-------------|
| `useTodayRemainingLessons` | Fake lesson list (Emily Carter, James O'Brien…) |
| `useTodayOverview` | Static counts (5 lessons, £210 earnings) |
| `useNextLessonDetails` | Fake next lesson |
| `useWeeklyGoals` | Static 22 hours |
| `useMonthlyGoals` | Static 80 lessons |
| `useInstructorLiveStats` | Static £1540 earnings |
| `useTomorrowPreview` / `useTomorrowLessons` | Fake tomorrow schedule |
| `useInstructorStreak` | Static 12-day streak |
| `usePendingJobsCount` | Static count of 2 |

**Changes:**
1. Remove `if (isDemoMode) return demoXxx;` from all 8 hooks
2. Remove demo imports from each hook
3. Delete `src/data/demoData.ts`
4. Remove `DemoModeProvider` from `App.tsx`
5. Delete `src/context/DemoModeContext.tsx`
6. Remove any demo toggle UI (if present in settings)

### Category B: Hardcoded Public Stats (2 files)

| File | Issue | Fix |
|------|-------|-----|
| `src/components/instructor-features/StatsBar.tsx` | "500+ Active Instructors", "12,000+ Pupils", "87% Pass Rate" — all hardcoded | Query live counts from `instructors` (where `is_active = true`) and `pupils` tables. Cache with long staleTime. Pass rate: query `driving_test_results` for real aggregate. |
| `src/pages/HomepageRedesignDemo.tsx` | "500+ Active Instructors", "50,000+ Lessons", "4.9★ Rating" hardcoded | Same approach — query live data or remove if this is only a demo page |

### Category C: Placeholder Features (4 items)

| Location | Issue | Fix |
|----------|-------|-----|
| `MobileScheduleView.tsx` line 534 | "Google Calendar integration coming soon" in reschedule dialog | Wire up actual reschedule: create new lesson + cancel old, or use the existing calendar sync system |
| `FleetMileageTracker.tsx` line 283 | "Xero sync coming soon" | Remove the text — it's informational, not blocking data. Change to "Export CSV/PDF to email to your accountant." |
| `DigitalWaiverManager.tsx` line 178 | "Send reminders feature coming soon" toast | Wire up the existing SMS reminder system to send waiver reminders, or remove the button |
| `InstructorDomainsManagement.tsx` lines 98-111 | Renew/Manage/Upgrade hosting all show "coming soon" toasts | Either wire to the 20i API for real domain management, or disable the buttons with proper messaging |

### Category D: Cross-Platform Data Consistency

Ensure all portals (parent, pupil, instructor, admin) use the same source of truth:

| Area | Check | Status |
|------|-------|--------|
| Payment history | Parent + Pupil + Instructor all query `payment_history` | ✅ Already live |
| Attendance | Parent queries `scheduled_lessons` | ✅ Already live |
| Lesson notes | Parent queries `lesson_feedback` | ✅ Already live |
| Pupil balance | Uses `account_balance` column | ✅ Already live |
| Driver scores | Calculated from `geotab_driver_events` | ✅ Already live (fixed in previous task) |
| Speeding events | Queries `telematics_alerts` | ✅ Already live |

### Implementation Order

1. **Remove demo mode system** — delete context, data file, strip all hooks (8 files)
2. **Wire StatsBar to live data** — add queries for instructor count, pupil count, pass rate
3. **Fix "coming soon" placeholders** — reschedule dialog, waiver reminders, domain management
4. **Clean up** — remove unused imports, verify no other static fallbacks remain

### Technical Notes

- StatsBar will use `useQuery` with 30-minute `staleTime` since aggregate stats don't need real-time updates
- The reschedule dialog fix involves creating a new `scheduled_lesson` with updated time/date and cancelling the old one, then triggering calendar sync
- No database migrations needed — all tables already exist

