

## Plan: Replace iframe card payment with full-page redirect

### Problem
The Cardstream HPP is embedded in an iframe that doesn't fit mobile screens regardless of height adjustments. Iframes are fundamentally problematic on mobile for payment forms -- they cause scrolling issues, viewport problems, and poor UX.

### Solution
Replace the iframe approach with a **full-page redirect** to the Cardstream HPP. This is the standard, most reliable integration method for hosted payment pages and works on every device.

### How it works today
1. User clicks "Pay by Card" → `elavon-checkout` returns `gatewayUrl` + `formData`
2. A hidden form auto-submits into an iframe
3. Cardstream HPP loads inside the iframe (broken on mobile)
4. After payment, `payment-callback` redirects back

### How it will work
1. User clicks "Pay by Card" → booking is created → `elavon-checkout` returns `gatewayUrl` + `formData`
2. A hidden form auto-submits as a **full-page navigation** (no iframe)
3. Cardstream HPP loads as a full page (works perfectly on all devices)
4. After payment, `payment-callback` redirects back to `/booking-confirmation` (already works this way)

### Changes

**1. `src/components/payments/CardstreamPayButton.tsx`** — Complete rewrite
- Remove all iframe logic, `showIframe` state, `iframeRef`, `handleIframeLoad`
- Keep the button and `handlePay` function
- On pay: call `elavon-checkout`, then create a form targeting `_self` (full page) and submit it
- Component becomes much simpler: just a button that triggers a redirect

**2. `src/components/payments/CardstreamCheckout.tsx`** — Minor cleanup
- Remove the iframe height workaround
- Keep wallet buttons (Apple Pay, Google Pay) as-is -- they use native SDKs, not iframes
- Keep the "Or pay with card" divider and CardstreamPayButton

**3. `src/pages/PublicPaymentPage.tsx`** — No structural changes needed
- The CardstreamCheckout component will automatically use the new redirect flow

**4. `supabase/functions/elavon-checkout/index.ts`** — No changes needed
- Already returns `gatewayUrl` and `formData` which is exactly what a full-page form POST needs

**5. `supabase/functions/payment-callback/index.ts`** — No changes needed  
- Already handles the POST callback and redirects to the correct page with HTML meta refresh

### What stays the same
- Apple Pay / Google Pay wallet buttons (native SDK, no iframe)
- Klarna / Clearpay BNPL buttons (redirect-based, already work)
- All backend edge functions
- Payment callback and balance crediting logic
- Booking creation flow

### Key benefit
The Cardstream HPP is designed to be a full-page experience. By using it as intended, we get a mobile-optimized card entry form that Cardstream maintains, with proper keyboard handling, autofill, and responsive layout -- zero iframe headaches.

