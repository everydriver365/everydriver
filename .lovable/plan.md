

## Add Pre-filled Amount to Payment Link QR Code

### What exists today
- `PaymentLinkShare` generates a QR code and shareable link for `/pay/:instructorId` (no amount).
- `PublicPaymentPage` already reads `?amount=X` from the URL and pre-fills the amount field.

### What to build
Add an optional amount input to `PaymentLinkShare` so the instructor can enter a specific amount. When provided, the generated URL becomes `/pay/:instructorId?amount=50`, and the QR code and copy/share links all reflect that.

### Changes (single file)

**`src/components/instructor/PaymentLinkShare.tsx`**
- Add a state variable `customAmount` (string, default empty).
- Add a number input field above the QR code for the instructor to optionally enter an amount (£1–£5,000).
- Update the `paymentUrl` computation: if `customAmount` is a valid number, append `?amount={customAmount}` to the URL.
- The QR code, displayed link, copy, and share actions will all automatically use the updated URL since they reference `paymentUrl`.

No database or backend changes needed — this is purely a UI enhancement to the existing component.

