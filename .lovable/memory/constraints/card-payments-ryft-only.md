---
name: Card payments → Ryft only
description: All card / QR / payment-link flows must invoke `ryft-create-checkout`. Square card components are deleted; do not re-introduce them.
type: constraint
---

Every user-facing card-payment surface MUST call the `ryft-create-checkout`
edge function and redirect to its hosted checkout URL. Square's card form,
Square wallet buttons (Apple/Google Pay), and Cardstream/NPI are forbidden
for live card flows.

Active card entry points (all Ryft):
- `PupilPaymentModal` / `PupilPaymentDrawer` — "Pay by Card" button
- `PayInSafariButton` (native wrapper fallback)
- `ParentPaymentTopUp`
- `TakePaymentModal` (instructor)
- `PupilPaymentsManager` (payment-link generation)
- `BookingSummary` (both `/pages` and `/pages/everydriver`) — embedded Ryft checkout
- `MobileBookingView` — "Pay by Card" button
- `PublicPaymentPage` (`/pay/:instructorId`) — covers all shared payment links and QR codes pointing at `/pay/...`
- `public-start-payment` edge fn — `method: "card"` (and deprecated alias `"square"`) dispatch to Ryft

Deleted components — do NOT re-create:
- `src/components/payments/SquareWalletButtons.tsx`
- `src/components/payments/SquarePaymentForm.tsx`
- `src/components/pupil-portal/SquareWalletButtons.tsx`
- `src/components/booking/BookingWalletButtons.tsx`

Edge functions retained for non-card use only:
- `square-webhook` — historic payment settlement
- `square-invoice-manage` + `SquareInvoicesPage` — invoice management
- `pupil-payment-checkout` — Klarna + Clearpay BNPL only (NPI/Cardstream
  branch removed)

Apple Pay / Google Pay are NOT mounted as standalone buttons anymore —
Ryft's hosted checkout surfaces them automatically when the device supports them.
