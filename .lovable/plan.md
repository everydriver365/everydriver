

## Payment Page with QR Code & Shareable Link (Elavon)

### What We'll Build
A public-facing payment page at `/pay/:instructorId` where anyone can enter an amount and pay an instructor via Elavon (Cardstream Hosted Fields). The instructor gets a shareable link and auto-generated QR code pointing to this page.

### Architecture

```text
Instructor Dashboard                    Public Payment Page
┌──────────────────────┐               ┌──────────────────────┐
│ "Get Payment Link"   │  shares URL   │  /pay/:instructorId  │
│  - Copy link         │ ──────────►   │                      │
│  - Show QR code      │               │  Instructor branding │
│  - Share via SMS     │               │  Amount input (£)    │
│  - QR auto-generated │               │  Elavon card fields  │
│    from URL          │               │  Apple Pay button    │
└──────────────────────┘               │  Payment confirmation│
                                       └──────────────────────┘
```

### Changes

| # | File | Change |
|---|------|--------|
| 1 | **`src/pages/PublicPaymentPage.tsx`** | **Create** — Public page that loads instructor details (name, logo) by ID, shows an amount input field, then renders `CardstreamCheckout` with the entered amount. On success, shows confirmation. No auth required. |
| 2 | **`src/App.tsx`** | Add route: `<Route path="/pay/:instructorId" element={<PublicPaymentPage />} />` |
| 3 | **`src/components/instructor/PaymentLinkShare.tsx`** | **Create** — Component for instructors to view/copy their payment link (`everydriver.lovable.app/pay/{id}`), generate a QR code from the URL (using a lightweight JS QR library or a QR API), and share via native share sheet. Used from the Take Payment sheet or settings. |
| 4 | **`src/components/instructor/TakePaymentSheet.tsx`** | Add a "Share Payment Link" option that shows the QR code generated from the URL and copy/share buttons. Uses the new `PaymentLinkShare` component. |

### Public Payment Page Flow
1. Page loads → fetches instructor name, logo, and `merchantIdForHPF` from `instructors` table (public select via RLS or edge function)
2. User enters amount in a styled input (min £1, max configurable)
3. Clicks "Continue" → renders `CardstreamCheckout` with that amount and `instructorId`
4. Payment processed via existing `payment-intent-create` → `payment-direct-sale` flow
5. Success screen shown with confirmation

### QR Code Generation
Generate the QR code client-side from the payment URL using the `qrcode` npm package or a free API like `https://api.qrserver.com/v1/create-qr-code/?data=URL`. No need for a stored QR image — it's generated dynamically from the instructor's payment link URL.

### Security Considerations
- The public page only reads non-sensitive instructor data (name, logo, merchant ID for hosted fields)
- Card data is handled entirely by Cardstream's hosted fields (PCI compliant)
- Payment recording uses existing edge functions with server-side validation

