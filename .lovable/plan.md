

## Add Google Pay Button to CardstreamCheckout

### What changes
Add a Google Pay button alongside the existing Apple Pay button in `CardstreamCheckout.tsx`. The backend (`payment-direct-sale`) already supports `google_pay` — only frontend work is needed.

### How it works

**File: `src/components/payments/CardstreamCheckout.tsx`**

1. **Detect Google Pay availability** — use the Google Pay JS API (`google.payments.api.PaymentsClient`) with `isReadyToPay` to check browser/device support
2. **Load the Google Pay SDK** — use the existing `loadScript` helper to load `https://pay.google.com/gp/p/js/pay.js`
3. **Add `canGooglePay` state** — set after `isReadyToPay` resolves true
4. **Add `payWithGooglePay` callback** — creates a `PaymentDataRequest` with Cardstream/Elavon as the gateway, opens the Google Pay sheet, extracts the token, and sends it to `payment-direct-sale` with `method: "google_pay"` and `googlePayPaymentToken`
5. **Render the Google Pay button** — show it alongside Apple Pay (both can appear on Android Chrome). Use Google's branded button styling (`GPay` black button matching the Apple Pay button height/style)
6. **Update the "or pay with card" divider** — show when either wallet button is visible

### UI layout (390px)
```
┌─────────────────────────┐
│ [ Apple Pay ]           │  ← Safari/iOS only
│ [ Google Pay ]          │  ← Chrome/Android
│ ───── or pay with card ─│
│ Card number             │
│ Expiry     CVV          │
│ [ Pay £XX.XX ]          │
│ 🔒 Secured              │
└─────────────────────────┘
```

### Google Pay configuration
- Gateway: `cardstream`
- Gateway merchant ID: from `ELAVON_MERCHANT_ALIAS` (already available via `merchantIdForHPF` prop)
- Environment: `PRODUCTION` (with `TEST` fallback for development)
- Allowed payment methods: `CARD` with networks `VISA`, `MASTERCARD`, `AMEX`
- Tokenization: `PAYMENT_GATEWAY` type

### Files to modify
- `src/components/payments/CardstreamCheckout.tsx` — add Google Pay detection, button, and payment flow

