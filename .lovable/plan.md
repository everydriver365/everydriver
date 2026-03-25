

## Make Fee Structure UK-Compliant

You're right — the UK Payment Services Regulations 2017 prohibit surcharging customers for card payments. Calling it a "processing fee" or linking it to payment method would be illegal.

### Compliant Approach: "Service Fee"

The fee is legal if it's framed as a **platform service fee** (for using the booking/management platform) — not tied to the payment method. This is how Deliveroo, Just Eat, Uber, etc. operate in the UK.

### Changes

**Rename across the entire app** — every instance of "Admin fee" or "Processing fee" becomes **"Service fee"**:

1. **`AdminFeeBreakdown.tsx`** — label text "Admin fee" → "Service fee"
2. **`OrderReviewSummary.tsx`** — label text "Admin fee" → "Service fee"
3. **`CommissionPayerSettings.tsx`** — heading and description updated
4. **`CommissionSettingsManager.tsx`** — help text updated
5. **`AdminFeeIncomeTile.tsx`** — tile title "Admin Fee Income" → "Service Fee Income"
6. **`AdminSettingsGrid.tsx`** — description text updated
7. **`TakePaymentModal.tsx`** — comments only (no user-facing text)

**Add a small disclosure line** in `AdminFeeBreakdown.tsx`:
> "Platform service fee for booking management"

This makes clear the fee is for the platform service, not for the payment method — keeping it fully compliant.

### Files Modified
- `src/components/payments/AdminFeeBreakdown.tsx`
- `src/components/booking/OrderReviewSummary.tsx`
- `src/components/instructor/CommissionPayerSettings.tsx`
- `src/components/admin/CommissionSettingsManager.tsx`
- `src/components/admin/AdminFeeIncomeTile.tsx`
- `src/components/admin/AdminSettingsGrid.tsx`

No database or logic changes — just label/copy updates.

