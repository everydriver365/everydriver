

## Switch Elavon from HPP Redirect to Direct Integration (Hosted Fields)

### What This Means
Instead of redirecting users off-site to Cardstream's payment page (HPP), card details will be entered **inline on your site** using Cardstream's Hosted Fields SDK (secure iframes for card number, expiry, CVV). The card data never touches your server — it's tokenized by Cardstream, then the token is sent to your backend for a Direct API sale.

### Current State
You already have most of the infrastructure built:
- **`CardstreamCheckout.tsx`** — A working Hosted Fields component with card inputs + Apple Pay
- **`payment-intent-create`** — Creates a `payment_intents` record and returns merchantId + SDK URL
- **`payment-direct-sale`** — Takes a payment token and processes a Direct API sale

However, these currently use NPI credentials. They need to use Elavon credentials instead.

### Changes

| File | Change |
|------|--------|
| **`supabase/functions/payment-intent-create/index.ts`** | Switch from `NPI_MERCHANT_ID` to `ELAVON_MERCHANT_ALIAS`; set `provider: "elavon"` |
| **`supabase/functions/payment-direct-sale/index.ts`** | Switch from `NPI_MERCHANT_ID`/`NPI_MERCHANT_SECRET` to `ELAVON_MERCHANT_ALIAS`/`ELAVON_SECRET_KEY` |
| **`src/components/booking/MobileBookingView.tsx`** | Replace `CardstreamPayButton` (HPP redirect) with `CardstreamCheckout` (inline Hosted Fields) in the recommended payment box |
| **`src/components/payments/CardstreamPayButton.tsx`** | No longer used in main flow — can keep for fallback or remove |
| **`src/pages/BookingSummary.tsx`** | Desktop flow: replace HPP redirect with `CardstreamCheckout` inline component, passing `merchantIdForHPF` from the Elavon merchant alias |

### Flow After Change
1. User clicks "Pay Card" → booking record created, `CardstreamCheckout` renders inline
2. Component calls `payment-intent-create` → gets `orderRef` + `merchantId`
3. Hosted Fields SDK loads, renders secure iframes for card number/expiry/CVV
4. User enters card details and clicks "Pay £X" → SDK tokenizes → `paymentToken` returned
5. Component calls `payment-direct-sale` with the token → Direct API processes the sale
6. Success → redirect to confirmation page

No redirect off-site. Card details stay in secure iframes (PCI compliant). Everything happens on your page.

