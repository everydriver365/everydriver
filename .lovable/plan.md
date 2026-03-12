

## Cardstream Payment Gateway — Rebuild Plan

### Current Problems

The existing setup has **4 overlapping approaches** spread across 6+ edge functions and 2 frontend components:

1. **`CardstreamHostedFieldsCheckout`** — loads jQuery + Cardstream SDK via iframes. Fragile: blocked by CSP, ad blockers, Brave shields. Requires jQuery as a dependency.
2. **`CardstreamEmbeddedCheckout`** — similar approach with extra diagnostics, still jQuery-dependent and iframe-based.
3. **`npi-checkout`** — HPP (Hosted Payment Page) redirect. Actually the most reliable approach but underused.
4. **`npi-hosted-fields`** — yet another init function duplicating signature logic.
5. Signature generation is duplicated in 4 places (shared helper exists but isn't always used).
6. `payment-direct-sale` and `cardstream-direct-sale` both do server-to-server SALE with duplicate code.

### Recommended Approach: HPP (Hosted Payment Page)

Cardstream's **Hosted Payment Page** is the most reliable integration method:
- No client-side SDK, no jQuery, no CSP issues, no ad-blocker problems
- Works on all devices and browsers
- PCI compliance handled entirely by Cardstream
- User is redirected to Cardstream's secure page, then POST-redirected back via `payment-callback`

This is what `npi-checkout` already does — the plan is to make it the **single primary method** and clean up everything else.

### What We'll Do

**1. Consolidate to a single edge function: `npi-checkout`**
- Clean up the existing function to use the shared `cardstream_signature.ts` helper (eliminate duplicate signature code)
- Add support for pupil balance top-ups (pass `type=balance` flag)
- Ensure it records a `payment_intents` row for tracking

**2. Replace both frontend checkout components with a simple HPP redirect**
- Create one component: `CardstreamPayButton` — a button that calls `npi-checkout`, receives form data, and auto-submits a hidden form to Cardstream's HPP
- No SDK loading, no jQuery, no iframes — just a form POST redirect
- Works identically on mobile and desktop

**3. Update `payment-callback` (already handles NPI responses)**
- Already works — just verify it correctly handles the redirect back and updates `payment_intents` status

**4. Clean up unused functions**
- Mark `cardstream-hostedfields-init`, `cardstream-direct-sale`, `payment-direct-sale`, `npi-hosted-fields` as deprecated (or delete)
- Remove `CardstreamHostedFieldsCheckout` and `CardstreamEmbeddedCheckout` components

**5. Update booking pages**
- Replace `CardstreamEmbeddedCheckout` usage in `BookingSummary` and `MobileBookingView` with the new `CardstreamPayButton`

### New Component Architecture

```text
User clicks "Pay £X"
       │
       ▼
CardstreamPayButton
       │
       ├── calls npi-checkout edge function
       │   (creates payment_intents row, signs fields, returns formData + gatewayUrl)
       │
       ├── auto-submits hidden <form> to Cardstream HPP
       │
       ▼
Cardstream Hosted Page (user enters card details)
       │
       ▼
POST redirect → payment-callback edge function
       │
       ├── verifies signature
       ├── updates payment_intents status
       ├── records payment_history
       ├── updates pupil balance (if applicable)
       └── redirects user to confirmation page
```

### Files to Create/Modify

- **Create**: `src/components/payments/CardstreamPayButton.tsx` — simple redirect-based payment button
- **Modify**: `supabase/functions/npi-checkout/index.ts` — use shared signature helper, add payment_intents tracking
- **Modify**: `src/pages/BookingSummary.tsx` — swap `CardstreamEmbeddedCheckout` for `CardstreamPayButton`
- **Modify**: `src/components/booking/MobileBookingView.tsx` — same swap
- **Delete**: `CardstreamHostedFieldsCheckout.tsx`, `CardstreamEmbeddedCheckout.tsx` (after swap)

### No database changes required
The `payment_intents` and `payment_history` tables already exist and support this flow.

