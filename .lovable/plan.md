

## Full App Audit - Issues Found & Fix Plan

### 1. Missing Route: `/instructor/performance` (causes 404)
- **`InstructorPerformance.tsx`** exists as a page but has NO route in `App.tsx`
- The `CommandPalette.tsx` links to `/instructor/performance`
- **Fix:** Add `<Route path="/instructor/performance" element={<InstructorPerformance />} />` in `App.tsx` and add the lazy import

### 2. Dead navigation links: `/instructor/track` and `/instructor/dashboard` (cause 404)
- `BestMateHomeView.tsx` and `IOSNativeHomeView.tsx` both link to `/instructor/track` and `/instructor/dashboard`
- No such routes exist. The correct routes are `/instructor/tracking` and `/instructor` respectively
- **Fix:** Change `navigate("/instructor/track")` to `navigate("/instructor/tracking")` and `navigate("/instructor/dashboard")` to `navigate("/instructor")` in both files

### 3. Unused import: `InstructorMiniWebsite`
- `App.tsx` line 118 imports `InstructorMiniWebsite` but it is never assigned to any route
- This is dead code that increases bundle size
- **Fix:** Remove the unused import

### 4. `deposit_deadline_days` hardcoded to 30 days
- `DepositSettingsEditor.tsx` and `BookingSummary.tsx` both hardcode "30 days" instead of using the instructor's `deposit_deadline_days` database field
- The field exists in the database but is never read or displayed
- **Fix:** Fetch `deposit_deadline_days` from the instructor record and use it in the deposit warning text in both `DepositSettingsEditor.tsx` and `BookingSummary.tsx`

### 5. Cancellation policy not enforced in cancel flow
- `CancelLessonDialog.tsx` does not check `cancellation_policy_hours` or `cancellation_charge_percent` from the instructor record
- The charge option is always a simple "charge" or "no_charge" toggle with the full lesson amount -- it never uses the instructor's configured charge percentage
- Note: The pupil self-service cancel flow in `PupilPortalSchedule.tsx` correctly uses `cancel_notice_hours` from `pupil_booking_settings`, which is a separate table. The instructor-side `CancelLessonDialog` is fine as-is since instructors manually choose the charge option. The gap is that `cancellation_charge_percent` could pre-populate the charge amount.
- **Fix:** In `CancelLessonDialog`, fetch instructor's `cancellation_charge_percent` and use it to calculate the default charge amount instead of always using the full lesson price

### 6. `cancellation_policy_text` never displayed to pupils
- Instructors can set custom cancellation policy text via `CancellationPolicyEditor.tsx`, but it is never shown on any pupil-facing page (booking page, mini-website, pupil portal)
- **Fix:** Display `cancellation_policy_text` on the booking summary page and/or the mini-website contact/booking section

### Summary of changes by file:

| File | Fix |
|------|-----|
| `src/App.tsx` | Add `/instructor/performance` route; remove unused `InstructorMiniWebsite` import |
| `src/components/instructor/BestMateHomeView.tsx` | Fix `/instructor/track` to `/instructor/tracking`; fix `/instructor/dashboard` to `/instructor` |
| `src/components/instructor/IOSNativeHomeView.tsx` | Same navigation fixes as above |
| `src/components/instructor/DepositSettingsEditor.tsx` | Use `deposit_deadline_days` from instructor record instead of hardcoded 30 |
| `src/pages/BookingSummary.tsx` | Use `deposit_deadline_days` from instructor record instead of hardcoded 30 |
| `src/components/instructor/CancelLessonDialog.tsx` | Pre-populate charge amount using `cancellation_charge_percent` |
| `src/pages/BookingSummary.tsx` or mini-website | Display `cancellation_policy_text` to pupils |

