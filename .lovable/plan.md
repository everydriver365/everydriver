## Goal

Make sure every place where an instructor (or admin/school user) **picks a pupil to act on** hides archived pupils (`deleted_at IS NOT NULL`). The DB trigger already blocks bookings against deleted pupils, but pickers should not even surface them.

## Scope

In-scope = "selection" surfaces: pickers, dropdowns, search overlays, multi-select lists for bulk actions, "assign pupil" steps, booking modals, FAB quick-actions. Read-only single-pupil views (loaded by id), the dedicated Archived Pupils dialog, GDPR exports, and pupil-portal screens that load the logged-in pupil's own row are **out of scope** — they intentionally include or are restricted to one row.

## Files to fix (add `.is("deleted_at", null)` to the pupils query)

Instructor pickers / selection surfaces:
- `src/components/instructor/VoiceQuickAddLessonSheet.tsx`
- `src/components/instructor/BulkSMSDialog.tsx`
- `src/components/instructor/BroadcastMessageSheet.tsx` (if it lists pupils)
- `src/components/instructor/BriefingActionModal.tsx`
- `src/components/instructor/PupilNoteSheet.tsx` (pupil chooser)
- `src/components/instructor/RecordTestResultDialog.tsx`
- `src/components/instructor/QuickTestResultForm.tsx`
- `src/components/instructor/GapFillCard.tsx` / `GapsFiller.tsx` (pupil picker for gap)
- `src/components/instructor/JobOfferAlert.tsx` (when assigning)
- `src/components/instructor/end-lesson/StepBookNext.tsx`
- `src/components/instructor/subscriptions/AddSubscriptionSheet.tsx`
- `src/components/instructor/bulk-ops/BulkSMSTab.tsx`
- `src/components/instructor/bulk-ops/BulkPriceUpdateTab.tsx`
- `src/components/instructor/dashboard/NotesWidget.tsx` (if it shows a pupil chooser)
- `src/components/instructor/InstructorSearchOverlay.tsx` (search → tap to action)
- `src/components/instructor/PupilRateEditor.tsx` (if list-based)
- `src/components/instructor/EditPupilSheet.tsx` (only if it lists pupils to choose; skip if it edits the one passed in)
- `src/pages/InstructorSendReminder.tsx`
- `src/pages/InstructorTakePayment.tsx` (pupil picker)
- `src/pages/InstructorNotes.tsx` (pupil chooser only)
- `src/pages/InstructorJobs.tsx` (assign-to-pupil flow only)

Course planner:
- `src/components/course-planner/CoursePlannerSheet.tsx`
- `src/components/course-planner/CoursePlannerForm.tsx`

Admin selection surfaces:
- `src/components/admin/BespokeBookingModal.tsx`
- `src/components/admin/ReassignPupilsDialog.tsx`
- `src/components/admin/AdminBookingsManager.tsx` (pupil picker portion)
- `src/components/admin/AdminCommandCenter.tsx` (search → action)

School selection surfaces:
- `src/components/school/SchoolTakeBookingModal.tsx` (when wired to live data)

Shared:
- `src/components/HeaderSearchBox.tsx` (global pupil search → action)

## Verification

For each touched file: confirm the query is the one feeding a chooser/multi-select (not a single-pupil-by-id read), and that adding the filter does not regress an "include archived" toggle (e.g. `ArchivedPupilsDialog`, GDPR exports, admin records manager — leave those alone).

## Explicitly out of scope (leave as-is)

- `src/components/instructor/pupils/ArchivedPupilsDialog.tsx`
- `src/components/admin/PupilRecordsManager.tsx` (admin records view; needs deleted rows)
- `src/components/instructor/DataExportManager.tsx` / `AnnualBusinessReport.tsx` / `GDPRRetentionWidget.tsx` (compliance exports)
- All single-pupil-by-id reads (PupilPortal, BrandedPupilPortal, PremiumPupilProfile, ParentPortal, pupil-portal/*, RemoteSigning, PassReport, ExpandablePupilCard detail load, etc.)
- Stats/aggregation hooks (`useActivePupilsCount`, `useDormantPupilsCount`, dashboards) — they already use status filters appropriate to their purpose; will spot-check but not blanket-edit.

## Approach

Surgical edits only — add `.is("deleted_at", null)` next to the existing `.from("pupils")` chain in each in-scope file. No behaviour changes elsewhere. After edits, grep again to confirm every in-scope picker has the filter.
