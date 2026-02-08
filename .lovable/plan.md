

## Commission QR Code Selection & Dual QR Codes

### Overview

Allow instructors to choose who absorbs the platform commission fee on card payments -- either the pupil or the instructor. Based on this choice, the correct QR code is displayed throughout the app. Two separate QR code images can be uploaded in Settings.

---

### Database Changes

**Add 3 new columns to the `instructors` table:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `payment_qr_url_pupil_pays` | text, nullable | null | QR code image for when the pupil pays the commission |
| `payment_qr_url_instructor_pays` | text, nullable | null | QR code image for when the instructor pays the commission |
| `commission_payer` | text | `'pupil'` | Who pays the commission: `'pupil'` or `'instructor'` |

The existing `payment_qr_url` column remains as a fallback for backward compatibility -- if the new fields are empty, the system falls back to it.

---

### Settings Page Changes (InstructorSettings.tsx)

Replace the single "Payment QR Code" upload section with:

1. **Commission Payer Toggle** -- A radio group or segmented control: "Pupil Pays Commission" vs "Instructor Pays Commission"
2. **Two QR Code Uploads** side by side:
   - "Pupil Pays Commission QR" -- upload for `payment_qr_url_pupil_pays`
   - "Instructor Pays Commission QR" -- upload for `payment_qr_url_instructor_pays`
3. A visual indicator showing which QR is currently active based on the toggle selection

---

### PaymentQRModal Changes

Update the modal to accept both QR URLs and the `commission_payer` setting, then display:
- The correct QR code based on who pays commission
- A label beneath the QR: "Pupil pays commission" or "Instructor pays commission" so it's clear which code is being shown

The modal already receives `paymentQrUrl` -- this will be replaced with logic that resolves the correct URL based on context.

---

### Display Logic Across the App

All 7 places that show the PaymentQRModal will be updated:

| Location | Context | QR Shown |
|----------|---------|----------|
| InstructorPortal (mobile) | Instructor viewing | Based on `commission_payer` setting |
| InstructorPortal (desktop) | Instructor viewing | Based on `commission_payer` setting |
| InstructorPay | Instructor "Take Payment" | Based on `commission_payer` setting |
| InstructorPortalLayout | Sidebar QR button | Based on `commission_payer` setting |
| InstructorMobileHeader | Settings dropdown | Based on `commission_payer` setting |
| ExpandablePupilCard | Pupil card QR button | Based on `commission_payer` setting |
| PupilCardStack | Pupil card QR button | Based on `commission_payer` setting |

Each location will fetch or receive both QR URLs plus the `commission_payer` preference, then pass the resolved URL to the modal.

---

### Technical Details

**Resolved QR URL helper:**
```text
function getActivePaymentQrUrl(instructor):
  if commission_payer === 'pupil':
    return payment_qr_url_pupil_pays || payment_qr_url (fallback)
  else:
    return payment_qr_url_instructor_pays || payment_qr_url (fallback)
```

**Data fetching updates needed:**
- `InstructorPortal.tsx` -- add `payment_qr_url_pupil_pays`, `payment_qr_url_instructor_pays`, `commission_payer` to select query
- `InstructorPay.tsx` -- same
- `InstructorPortalLayout.tsx` -- same (uses `useInstructorAuth` context)
- `ExpandablePupilCard.tsx` and `PupilCardStack.tsx` -- receive resolved URL from parent
- `InstructorSettings.tsx` -- add to profile type and fetch query

**InstructorAuthContext** -- If this context provides the instructor object, its query will also need updating to include the new columns so the QR is available app-wide without extra fetches.

**PaymentQRModal** -- Add a small badge/label showing the commission arrangement, e.g. "Commission: Pupil pays" in muted text below the QR image.

---

### Implementation Steps

| Step | What |
|------|------|
| 1 | Database migration: add 3 columns to `instructors` |
| 2 | Update `InstructorSettings.tsx`: commission payer toggle + dual QR uploads |
| 3 | Create `getActivePaymentQrUrl` helper utility |
| 4 | Update `PaymentQRModal` to show commission label |
| 5 | Update all 7 consumer locations to pass the resolved QR URL |
| 6 | Update instructor data queries to include new columns |

