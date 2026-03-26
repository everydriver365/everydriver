

## Fix: Missing `commissionSplitPercent` on InstructorMobileHeader's TakePaymentModal

### Investigation Result

I reviewed every entry point for the "Take Payment" flow across the codebase. The `TakePaymentModal` component (which has the new amount-entry + Square QR generation) is correctly used in all locations:

- `InstructorPay.tsx` (Money tab page) — correct
- `InstructorPortalLayout.tsx` (layout wrapper) — correct
- `InstructorMobileHeader.tsx` (header Pay button) — **missing `commissionSplitPercent` prop**
- `InstructorTakePayment.tsx` (dedicated route) — **missing `commissionSplitPercent` prop**
- `InstructorPortal.tsx` (dashboard) — correct

No old components (`PaymentQRModal` or `TakePaymentSheet`) are used in the Take Payment flow — those only appear in pupil detail cards.

### What might be happening

The header "Pay" button (visible on every page) opens a `TakePaymentModal` that is missing `commissionSplitPercent`, which means the admin fee breakdown won't calculate correctly. However, the modal itself should still show the new picker → amount entry → QR generation flow.

If you're seeing a static QR image instead of the amount entry form, it may be a **cached build**. A rebuild should resolve that.

### Fix

1. **`src/components/instructor/InstructorMobileHeader.tsx`** — Add `commissionSplitPercent={instructor?.commission_split_percent}` to the `TakePaymentModal`

2. **`src/pages/InstructorTakePayment.tsx`** — Add `commissionSplitPercent={instructor?.commission_split_percent}` to the `TakePaymentModal`

This ensures the fee breakdown works correctly regardless of which "Take Payment" entry point is used.

