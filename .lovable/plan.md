

## QR Code with Square Payment Link

### Current State
The QR code view currently shows a generic payment page link (`/pay/:instructorId`) via `PaymentLinkShare`. It does NOT generate a Square checkout — the pupil lands on a custom payment page where they still have to enter an amount and go through checkout manually.

The "Send Request" view already generates a real Square checkout link with a specific amount via the `square-checkout` edge function. The QR view doesn't have this capability.

### Plan

Enhance the QR code view to let the instructor enter an amount, generate a Square checkout link, and display a QR code that the pupil scans to pay directly — no intermediate page.

**File: `src/components/instructor/TakePaymentModal.tsx`**

1. When the instructor selects "QR Code", show an amount input (with quick-select buttons like £30/£40/£50/£100) and optional pupil selector — similar to the "Send Request" view
2. Add a "Generate QR" button that calls the `square-checkout` edge function with the entered amount
3. Once the Square checkout URL is returned, display a QR code (using `qrcode.react`) containing that direct Square payment URL
4. Include the admin fee breakdown below the amount input (reuse existing `AdminFeeBreakdown` component)
5. Show a "Reset" button to generate a new QR for a different amount

**File: `src/components/instructor/PaymentLinkShare.tsx`**

No changes needed — we'll build the new Square QR flow directly in the TakePaymentModal's QR view, replacing the current `PaymentLinkShare` usage with a richer inline component.

### Flow
```text
Instructor taps "QR Code"
  → Enters amount (e.g. £50)
  → Sees admin fee breakdown
  → Taps "Generate QR"
  → Edge function creates Square checkout link
  → QR code displayed with the Square URL
  → Pupil scans → lands on Square's hosted checkout → pays
```

### Technical Details
- Reuses the existing `square-checkout` edge function (already working for Send Request)
- Reuses `useAdminFee` and `AdminFeeBreakdown` for fee display
- Uses `QRCodeSVG` from `qrcode.react` (already installed)
- The return URL will be `/pay/:instructorId?success=true`
- Loading state while Square link is generated

