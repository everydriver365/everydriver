

## Replace Static QR Image with Dynamic Elavon Payment Link QR Code

### What's happening now
The QR Code view in the Take Payment modal shows a **static image** (`paymentQrUrl`) uploaded by the instructor — typically a bank transfer QR. It doesn't link to the Elavon online payment page.

### What we'll build
Replace the static QR image with a **dynamically generated QR code** that links to `/pay/:instructorId` — the Elavon payment portal. This lets pupils scan → land on the payment page → pay by card, Apple Pay, or Google Pay.

We'll also add optional pupil selection and amount pre-fill (like `PaymentLinkShare` already does) so the QR encodes a link like:
```
https://everydriver.lovable.app/pay/abc123?pupil=xyz&amount=35
```

### Technical changes

**`src/components/instructor/TakePaymentModal.tsx`**
1. Import `QRCodeSVG` from `qrcode.react` and add `PaymentLinkShare` -style controls
2. Replace the static `<img>` QR display with a `<QRCodeSVG>` that encodes the dynamic `/pay/:instructorId` URL
3. Add optional pupil selector dropdown and amount input above the QR code
4. Add copy link + share buttons below the QR (reuse pattern from `PaymentLinkShare`)
5. Remove the `paymentQrUrl` dependency from the QR view entirely — it's no longer needed for this view

**`src/components/instructor/TakePaymentModal.tsx` props** — `paymentQrUrl` prop can be kept for backward compat but won't be used by the QR view.

**No backend changes needed** — the `/pay/:instructorId` page already handles amount and pupil query params, wallet payments, and auto-reconciliation.

