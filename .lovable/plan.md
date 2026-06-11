# Card payments → Ryft only (platform-wide)

Audit complete. Most card flows already go through `ryft-create-checkout`, but **several user-facing surfaces still mount Square components**. The biggest one is `/pay/:instructorId` — every "Share payment link" and QR link lands there and currently renders Square.

Klarna, Clearpay, Cash, Bank, GoCardless, SumUp are out of scope (intentional).

## What stays as-is (already correct)
- Pupil portal modal + drawer card button → Ryft
- Parent top-up → Ryft
- Instructor "Take Payment" modal → Ryft
- PupilPaymentsManager link generation → Ryft
- Both BookingSummary "Pay by Card" buttons → Ryft
- `public-start-payment` dispatch → Ryft (just misleadingly named)

## Changes

### 1. `src/pages/PublicPaymentPage.tsx` — highest priority
Every shared payment link and QR (`/pay/:instructorId`) lands here and currently renders `SquareWalletButtons` + `SquarePaymentForm`. Replace the Square section with a single "Pay by Card" button that calls `ryft-create-checkout` and redirects to the hosted checkout URL (same pattern as `PupilPaymentModal`). Keep amount input, BNPL options, and branding untouched.

### 2. `src/components/pupil-portal/PupilPaymentDrawer.tsx`
Remove the `<SquareWalletButtons>` mount at line ~388 (Express Checkout block). Apple Pay / Google Pay on Ryft will come through the hosted checkout when the user taps the existing Ryft "Pay by Card" button — no separate wallet button needed. Leave the `isNativeWrapper` → `PayInSafariButton` branch (already Ryft).

### 3. `src/pages/BookingSummary.tsx` and `src/pages/everydriver/BookingSummary.tsx`
Remove the `SquarePaymentForm` / `SquareWalletButtons` mounts (lines ~2113 / ~2136, ~2164). The Ryft "Pay by Card" button already exists in both files — Square is now duplicate/dead UI underneath it.

### 4. `src/components/instructor/AddLessonSheet.tsx`
No code change needed — once `PublicPaymentPage` is Ryft (step 1), the `/pay/${slug}` link this opens is automatically correct.

### 5. `supabase/functions/public-start-payment/index.ts`
Accept `method: "card"` as the preferred name and keep `"square"` as a deprecated alias (so old QR/links keep working). Both dispatch to `ryft-create-checkout`.

### 6. `supabase/functions/pupil-payment-checkout/index.ts`
Remove the dead `gateway: "npi"` / Cardstream branch (no UI caller passes it; Cardstream is on the forbidden-gateways list).

### 7. Cleanup (delete dead files, no behaviour change)
- `src/components/booking/BookingWalletButtons.tsx` — no mount points
- After steps 1–3, the following are no longer imported anywhere and are safe to delete:
  - `src/components/payments/SquareWalletButtons.tsx`
  - `src/components/payments/SquarePaymentForm.tsx`
  - `src/components/pupil-portal/SquareWalletButtons.tsx`
- Keep `square-invoice-manage` and `SquareInvoicesPage.tsx` (invoice management, not checkout). Keep `square-webhook` for historic settlement.

## Out of scope
- QR URL values stored in `instructors.payment_qr_url*` — these are just raw URLs admins paste in. Once `PublicPaymentPage` is Ryft-only, existing links that point to `/pay/<slug>` automatically use Ryft. Any QR pointing at a Square-hosted URL (rare) is an admin data fix, not code.
- Klarna / Clearpay branches in `pupil-payment-checkout` — intentional BNPL.
- Square invoices page — historic data view, not a card processor.

## Technical detail
- New Ryft button payload mirrors `PupilPaymentModal.tsx:284`: `{ amount, orderReference, customerName, customerEmail, customerPhone, description, returnUrl, cancelUrl, instructorId, pupilId, serviceFeePence }`.
- `orderReference` format: keep existing prefix per surface (`PUPIL-…`, `PARENT-…`, `PUBLIC-…`).
- No DB migrations. No edge-function secret changes. `ryft-create-checkout` already deployed.

Shall I proceed?
