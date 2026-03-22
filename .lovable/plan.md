

## Plan: Add Missing Features to Comparison Matrix

### Current State
The `/compare` matrix has **120 features** across 13 categories. However, several features that exist in the app (and some new competitor-inspired ones) are not represented in the matrix.

### Missing Features to Add to the Matrix

These are features that already exist in the app but aren't listed in the comparison matrix:

| Feature | Category | Exists in App? |
|---------|----------|----------------|
| HMRC MTD quarterly filing | Business Tools | Yes (InstructorTax.tsx, mtd_quarterly_periods table) |
| Lead pipeline / CRM | Business Tools | Yes (InstructorPipeline.tsx) |
| Live lesson session tracking | Lesson Tracking | Yes (InstructorLiveSession.tsx) |
| Trip replay | GPS & Tracking | Yes (InstructorTripReplay.tsx) |
| Visitor live chat | Business Tools | Yes (InstructorVisitorChats.tsx) |
| Bulk operations | Business Tools | Yes (InstructorBulkOperations.tsx) |
| Pupil theory progress tracking | Pupil & Parent | Yes (TheoryProgressChart.tsx) |
| Earlier Test Guarantee (ETG) | Growth & Community | Yes (EarlierTestGuarantee.tsx) |
| DVSA Test Slot Finder | Scheduling | **No — new feature to build** |
| Platform update notifications | Core | Yes (InstructorPlatformUpdates.tsx) |
| Admin chat / support | Core | Yes (InstructorAdminChat.tsx) |
| Unified inbox | Core | Yes (InstructorUnifiedInbox.tsx) |
| Quick availability toggle | Scheduling | Yes (InstructorQuickAvailability.tsx) |
| Pending scheduling queue | Scheduling | Yes (InstructorPendingScheduling.tsx) |
| Reports hub | Reports & Insights | Yes (InstructorReportsHub.tsx) |
| Month-end financial reports | Reports & Insights | Exists in matrix but let me verify |

### New Feature to Build: DVSA Test Slot Finder
A page where instructors can monitor for earlier DVSA test cancellations and get notified when a slot opens. This is a high-value competitor feature.

- **New page**: `src/pages/InstructorTestSlotFinder.tsx`
- **New database table**: `test_slot_watches` (instructor_id, test_centre, preferred_dates, pupil_id, status, notified_at)
- **New edge function**: `check-dvsa-slots` — periodic check (initially manual trigger, with placeholder for DVSA API integration)
- **Route**: `/instructor/test-slot-finder`
- **Menu gate**: Add to `menu_feature_gates` as a gated feature

### Database Changes
One SQL migration to INSERT all ~15 new rows into `comparison_features` with appropriate `plan_values` for each of the 6 plan slugs. Plus CREATE `test_slot_watches` table for the new DVSA feature.

### Files Changed

| File | Change |
|------|--------|
| Database migration | INSERT ~15 new `comparison_features` rows + CREATE `test_slot_watches` table |
| `src/pages/InstructorTestSlotFinder.tsx` | **New** — DVSA test slot finder UI |
| `src/routes/instructorPortalRoutes.tsx` | Add route for test slot finder |
| `src/components/instructor/InstructorDesktopSidebar.tsx` | Add test slot finder to nav |

### Plan Values Strategy
- **Free**: Core features only (unified inbox, platform updates, admin chat)
- **All-In**: Adds pipeline, theory tracking, quick availability, pending scheduling, bulk ops
- **GPS+**: Adds trip replay, live session tracking
- **Dashcam tiers**: Same as GPS+ plus dashcam features
- **Multi-School**: Everything including ETG and test slot finder

