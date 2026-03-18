

## Plan: Arlo-Inspired Self-Service Enhancements

Your pupil portal already has most self-service features (schedule, cancel/rebook, progress, profile, payments, chat). The key Arlo-inspired additions that are missing:

### 1. Downloadable Certificates (New Component)
Create `PupilCertificates.tsx` — a "My Documents" section where pupils can generate and download:
- **Course Completion Certificate** — branded PDF with instructor logo, pupil name, hours completed, date
- **Test Pass Certificate** — celebratory branded certificate when test is passed
- **Payment Receipts** — downloadable receipt for each payment made

Uses `html2canvas` + `jsPDF` (or canvas-based approach) to generate PDFs client-side with the instructor's branding.

### 2. Self-Service Document Hub (New Section)
Add a "Documents" section to the pupil portal nav with:
- Auto-generated certificates based on milestones (10 hours, 20 hours, course complete, test passed)
- Payment receipt downloads from payment history
- Any instructor-uploaded documents (e.g. progress reports)

### 3. Enhanced Profile Self-Management
Add to existing profile page:
- **Emergency contact** field (name + phone)
- **Medical/accessibility notes** field
- **Preferred lesson duration** preference
- **Communication preferences** (SMS vs email vs push)

### Technical Changes

**New files:**
- `src/components/pupil-portal/PupilCertificates.tsx` — certificate generation and document hub

**Modified files:**
- `src/pages/BrandedPupilPortal.tsx` — add 'documents' section and route
- `src/components/pupil-portal/GroupedNavMenu.tsx` — add Documents nav item
- `src/components/pupil-portal/PupilPortalProfileEdit.tsx` — add emergency contact + preferences fields

**Database migration:**
- Add columns to `pupils` table: `emergency_contact_name`, `emergency_contact_phone`, `medical_notes`, `preferred_duration_minutes`, `communication_preference`

No new dependencies — certificates rendered via HTML/Canvas and downloaded as images or using the browser print API.

