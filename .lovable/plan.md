

## Redesign: Replace HPP redirect with embedded card form

### Problem
The Cardstream Hosted Payment Page (HPP) silently ignores address pre-fill fields. Logs confirm the structured address **is** sent correctly, but the responsive HPP template strips/ignores `customerAddress1`, `customerCity`, etc. This is a Cardstream HPP limitation, not a code bug.

### Solution
Replace the full-page HPP redirect for card payments with Cardstream's **Hosted Payment Fields** embedded directly in the checkout page. This keeps the user on-page, eliminates the address pre-fill problem entirely (address is already visible in our form), and maintains PCI compliance since card data is captured in Cardstream-hosted iframes.

The existing `payment-direct-sale` edge function already handles tokenized card payments (`method: "card_token"` with `paymentToken`), so the backend is ready.

### Architecture

```text
Current flow (broken address):
  Booking Form → elavon-checkout → HPP redirect → payment-callback → redirect back

New flow (embedded):
  Booking Form → payment-intent-create → Hosted Fields SDK (iframes in page)
               → payment-direct-sale (token + address) → instant response
```

### Changes

**1. New component: `src/components/payments/CardstreamEmbeddedCardForm.tsx`**
- Load Cardstream Hosted Fields SDK (`hostedfields.min.js`)
- Render card number, expiry date, and CVV as hosted iframes using `data-hostedfield` attributes
- Include hidden fields: `merchantID`, `amount`, `signature`, `action`, etc.
- On form submit, SDK tokenizes card data and includes `paymentToken` in the form data
- Intercept submission, extract token, call `payment-direct-sale` edge function via AJAX
- Pass `customerAddress`, `customerPostcode`, `customerPhone` directly to the direct sale
- Show inline success/error without navigation

**2. Update `src/components/payments/CardstreamCheckout.tsx`**
- Replace `CardstreamPayButton` (HPP redirect) with the new `CardstreamEmbeddedCardForm`
- Keep Apple Pay and Google Pay wallet buttons unchanged (already use direct API)
- Pass all customer details (name, email, phone, address, postcode) to the embedded form
- The embedded form sends address fields to `payment-direct-sale` for AVS checks

**3. Update `supabase/functions/payment-direct-sale/index.ts`**
- Accept `customerPhone` and `customerAddress` (full string) in addition to existing `customerAddress1`
- Add address splitting logic (reuse from `elavon-checkout`) to map full address string to `customerAddress1`, `customerAddress2`, `customerCity`, `customerCounty`
- Pass structured address fields to the Cardstream Direct API for AVS matching

**4. Update `supabase/functions/payment-intent-create/index.ts`**
- Return the hosted fields configuration data (form fields with signature) needed by the SDK
- Add a `hostedFields: true` flag to indicate the response includes SDK initialization data

**5. Remove unused redirect code**
- `CardstreamPayButton.tsx` can be removed or kept as legacy fallback
- The `elavon-checkout` edge function is no longer called from the booking flow (still used by pupil portal balance top-ups which have a separate flow)

### What stays the same
- Apple Pay and Google Pay buttons (already use `payment-direct-sale` direct API)
- `payment-callback` edge function (still needed for pupil balance top-ups and other redirect-based flows)
- Balance crediting via `increment_pupil_balance` RPC (called by `payment-direct-sale`)
- All booking creation logic
- Clearpay and Klarna flows

