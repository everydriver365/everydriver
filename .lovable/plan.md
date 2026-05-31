# Hide non-current/deleted pupils in selectors + allow adding a new pupil inline

## What "current pupil" means
Based on the `pupils` schema:
- `deleted_at IS NULL` (not soft-deleted)
- `status = 'active'` (not `inactive` / archived)

These two filters together = "current pupil". Every dropdown/picker that lets the user choose a pupil should apply both.

## Selectors to update
These components query `pupils` and present a chooser UI but currently don't filter properly:

1. `src/components/invoices/CreateInvoiceDialog.tsx` — no filter at all
2. `src/components/quotes/CreateQuoteDialog.tsx` — no filter at all
3. `src/components/instructor/PupilSelector.tsx` — has `deleted_at`, missing status
4. `src/components/instructor/PupilPickerDialog.tsx` / `PupilPickerSheet.tsx`
5. `src/components/instructor/ui/PupilSelectorRow.tsx`
6. `src/components/instructor/AddLessonSheet.tsx`
7. `src/components/instructor/AddCalendarEventDialog.tsx`
8. `src/components/instructor/DrivingTestStartDialog.tsx`
9. `src/components/instructor/QuickTestResultForm.tsx`
10. `src/components/instructor/PupilProgressReportGenerator.tsx`
11. `src/components/instructor/RefundModal.tsx`
12. `src/components/instructor/VoiceQuickAddLessonSheet.tsx`
13. `src/components/instructor/subscriptions/AddSubscriptionSheet.tsx`
14. `src/components/instructor/tracking/SessionStartPanel.tsx`
15. `src/components/instructor/dashboard/NotesWidget.tsx`
16. `src/components/instructor/CertificationTracker.tsx`
17. `src/components/instructor/LovableTracker.tsx`
18. `src/components/course-planner/CoursePlannerForm.tsx`
19. `src/components/test-requests/TestRequestForm.tsx`
20. `src/components/school/SchoolTakePaymentModal.tsx`
21. `src/pages/InstructorLiveSession.tsx`, `InstructorTestResults.tsx`, `InstructorSendReminder.tsx`, `InstructorTakePayment.tsx`, `instructor-app/InstructorPaymentsDesktop.tsx`

For each, add `.eq("status", "active").is("deleted_at", null)` to the pupil list query.

Excluded from this change (intentional — they need to surface all/archived pupils for management): admin pupil records manager, reassign-pupils dialog, instructor Pupils list page, reports/analytics, payment reconciliation, and any history/portal/back-office views.

## Add new pupil inline

Create one shared lightweight component:

`src/components/instructor/pupils/QuickAddPupilButton.tsx`
- Small "+ New pupil" button that opens a compact dialog
- Fields: name (required), email, phone, source (optional select)
- Inserts into `pupils` with `instructor_id = get_instructor_id_for_user(auth.uid())`, `status = 'active'`, `scheduling_status = 'unscheduled'`
- On success, returns the new pupil via `onCreated(pupil)` and shows a toast
- Admin scope variant: accepts an `instructorId` prop; when present, uses that as the new pupil's `instructor_id` (admin must already have selected an instructor in the parent dialog)

Wire `QuickAddPupilButton` into the selector header of every dialog listed above so the user can add a pupil without leaving the flow. On create, the parent appends the new pupil to its local list and auto-selects it.

For the heavyweight `PupilPickerSheet` / `PupilPickerDialog` (instructor browse-style picker), add the same trigger in the sheet header.

## Out of scope
- No mobile layout changes
- No schema migration (status + deleted_at already exist)
- No admin-side "all pupils" management list changes
- No changes to the full `AddPupilSheet` (kept for the dedicated Pupils page)

## Technical notes
- New pupil insert relies on existing RLS: `instructor_id = public.get_instructor_id_for_user(auth.uid())` for instructor scope; admin scope uses the explicitly selected `instructorId`.
- `QuickAddPupilButton` is purely additive — no existing AddPupilSheet behavior changes.
- All filters use the same two predicates so behavior is uniform.
