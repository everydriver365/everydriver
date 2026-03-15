

# Audit: What's Not Wired Up + UX Improvements

## Issues Found — Components Not Connected

### 1. CertificateGenerator — NOT used anywhere
The component exists but is never imported into any page. It should be embedded in the pupil detail screen so instructors can issue certificates from a pupil's profile.

### 2. WaitlistJoinCard — NOT used anywhere
Built but never placed on any mini-website page. Should render on the mini-website contact or home page when the instructor's availability is paused or fully booked.

### 3. WebsitePageEditor — NOT used anywhere
The visual block editor exists but isn't integrated into the mini-website settings page. Should be added as a tab or section in `InstructorMiniWebsiteSettings`.

### 4. School Dashboard — No navigation path
Route exists (`/school/dashboard`) but there's no link to it from any menu. School owners have no way to discover or reach it. Needs a conditional menu item or separate login flow.

### 5. CertificateGenerator doesn't save to DB
It generates a PDF and downloads it locally but never inserts into the `pupil_certificates` table that was created in the migration. Should record the issuance.

### 6. Bulk SMS uses `send-gap-sms` (single SMS) instead of `send-campaign` (bulk)
The plan said to wire up the existing `send-campaign` edge function, but the implementation sends individual SMS calls in a `Promise.allSettled` loop. Inefficient for 50+ pupils.

---

## UX Improvements (vs competitors like MyDriveHub, bookitDrive, ADI Diary Pro)

### 7. Bulk Operations — No confirmation dialog
Destructive actions (reschedule all, change all prices) happen on button click with no "Are you sure?" confirmation. Competitors show a summary modal before executing.

### 8. Bulk SMS — No character count warning for multi-part SMS
160 chars is shown but SMS over 160 chars splits into multiple messages (costs more). Should warn at 160 and show segment count (e.g. "2 SMS segments").

### 9. Reports Hub — No quick date presets
Users must manually pick start/end dates. Competitors offer "This Week", "This Month", "Last Month", "This Tax Year" buttons for one-tap selection.

### 10. Availability Rules — No visual calendar preview
Rules are saved but there's no visual calendar showing which days are blocked. Competitors show a month view with blocked days highlighted in red.

### 11. Parent Portal — No progress PDF export button
The plan included a "Download progress report PDF" button but it wasn't implemented. Parents should be able to export their child's progress to share.

### 12. Menu — Bulk Ops and Reports Hub missing `gateKey`
These two menu items don't have feature gating, meaning free-tier users can access them even if they should be gated behind a plan.

---

## Implementation Plan

### Fix: Wire up 4 orphaned components
- Import `CertificateGenerator` into the pupil detail view (in `InstructorPupils.tsx` pupil detail sheet)
- Import `WaitlistJoinCard` into `MiniWebsiteContact.tsx` when `availability_paused = true`
- Import `WebsitePageEditor` into `InstructorMiniWebsiteSettings.tsx` as a new "Page Editor" tab
- Add School Dashboard link to instructor menu (conditional on school membership)

### Fix: CertificateGenerator saves to `pupil_certificates`
- After PDF generation, insert a row recording the milestone, pupil, and date

### UX: Bulk ops confirmation dialog
- Add `AlertDialog` before reschedule and price update executions showing summary of changes

### UX: SMS segment counter
- Replace simple `{length}/160` with segment-aware counter: "1 SMS" up to 160, "2 SMS" at 161-306, etc.

### UX: Reports date presets
- Add chip buttons: "This Week", "This Month", "Last Month", "Tax Year (Apr-Apr)" that auto-set date range

### UX: Availability rules calendar preview
- Add a simple month grid below the rules list showing blocked days highlighted

### UX: Parent progress PDF export
- Add a "Download Report" button to the parent child-detail view that calls `generate-pdf` with `progress` type

### UX: Add `gateKey` to Bulk Ops and Reports Hub menu items

