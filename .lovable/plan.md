

## Settings & Feature Organisation Audit

After a thorough scan of the codebase, here are the issues found -- orphaned components, misplaced settings, and inconsistencies:

### 1. Orphaned Components (built but never imported anywhere)

| Component | Purpose | Where it should go |
|-----------|---------|-------------------|
| `EmergencyContactEditor.tsx` | Edit pupil emergency contact info | Pupil detail panels (`PupilCardStack`, `ExpandablePupilCard`, `DesktopPupilDetailPanel`) |
| `PreFlightChecks.tsx` | GPS/tracking system readiness check | GPS Setup page (`InstructorGPSSetup`) or Tracking settings |
| `ReminderSettings.tsx` | Lesson reminder channel preferences (SMS/email/push + timing) | Settings > Scheduling category, alongside Cancellation Policy |

### 2. Unused Imports (imported but never rendered)

| File | Unused Imports |
|------|---------------|
| `InstructorSettings.tsx` | `SyllabusBuilder`, `TrainingResources` -- imported on lines 39-40 but never used in JSX. Dead imports. |

### 3. Misplaced Settings Tiles

| Tile | Currently In | Should Be In |
|------|-------------|-------------|
| **Pupil Self-Service Booking** (`PupilBookingSettingsEditor`) | Website & Branding | **Scheduling** -- it controls booking/cancellation/rescheduling rules, not branding |
| **Bulk Messaging** (`BulkSMSDialog`) | Preferences & Data | **Not a setting** -- it's an action. Should be accessible from Messages/Inbox page, not buried in settings |
| **Referral Programme** | Preferences & Data | **Courses & Payments** -- referrals are a monetisation/growth tool |
| **Payment Summary** widget | Courses & Payments (settings) | This is a read-only dashboard widget, not a configuration. It belongs on the Money/Pay page, not in settings |

### 4. Duplicate Functionality

| Issue | Details |
|-------|---------|
| **Commission Payer** toggle | Exists in TWO places: (a) inline in "Images & Media" tile (lines 525-635 with full dual QR upload), and (b) as a separate `CommissionPayerSettings` tile under "Courses & Payments". These should be merged into one location. |
| **Visibility toggle** | Exists in THREE places: Settings page tile, InstructorPortal desktop header, and mobile home. The settings one is fine as canonical, but the duplicated logic is acceptable for quick-access. No action needed. |

### Proposed Changes

**A. Wire orphaned components:**
- Add `EmergencyContactEditor` to pupil detail panels (DesktopPupilDetailPanel / ExpandablePupilCard)
- Add `PreFlightChecks` to InstructorGPSSetup page
- Add `ReminderSettings` to Settings > Scheduling category

**B. Clean dead imports:**
- Remove unused `SyllabusBuilder` and `TrainingResources` imports from InstructorSettings.tsx

**C. Move misplaced tiles:**
- Move "Pupil Self-Service Booking" from Website & Branding → Scheduling
- Move "Referral Programme" from Preferences & Data → Courses & Payments
- Remove "Payment Summary" widget from Settings (it's already on the Pay page)
- Remove "Bulk Messaging" from Settings (it's already accessible from Inbox)

**D. Deduplicate Commission Payer:**
- Remove the inline commission payer toggle + dual QR uploads from the "Images & Media" tile
- Keep only the dedicated `CommissionPayerSettings` tile under Courses & Payments
- Move QR code uploads to a standalone "Payment QR Codes" tile under Courses & Payments

This reorganisation affects only `InstructorSettings.tsx` plus wiring 3 orphaned components into their correct parent pages. No database changes needed.

