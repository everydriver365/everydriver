

## Add "Pay Now" Link to Pupil Portal Payments Tab

**Current state**: The payments tab has a "Make Payment" button that opens `PupilPaymentModal` (which uses edge functions for Square/NPI/Klarna/etc). However, instructors also have a simpler QR-based payment link (`payment_qr_url_pupil_pays` / `payment_qr_url_instructor_pays`) that isn't shown to pupils in the portal. Pupils can't easily share a payment link either.

### Changes

**1. `src/pages/BrandedPupilPortal.tsx`**
- Add `payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer` to the instructor `.select()` query and `Instructor` interface
- Pass these new fields down to `PupilPortalPayments`

**2. `src/components/pupil-portal/PupilPortalPayments.tsx`**
- Accept new props: `paymentQrUrl`, `commissionPayer`, and the two QR URL variants
- Use `getActivePaymentQrUrl()` to resolve the correct payment link based on commission_payer setting
- If a payment link exists, render a prominent "Pay Now" card with:
  - An **"Open Payment Link"** button that opens the URL in a new tab
  - A **"Share Link"** button using `navigator.share()` (with clipboard fallback) so pupils can share it with parents/guardians or anyone paying on their behalf
- Show this regardless of debt status (some pupils may want to pre-pay or have someone else pay)

This reuses the existing `getActivePaymentQrUrl` helper already used across the instructor-side pages.

