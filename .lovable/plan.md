

## Assessment: Will Option A work?

**Short answer: It's risky, and here's why.**

The core problem is that Cardstream's Hosted Fields SDK is tightly coupled to their gateway's form submission flow. The SDK replaces your card inputs with iframes, but the tokenization step (`getPaymentDetails()`) is not a well-documented public API — it may not exist or may not return a token in the way we're trying to use it. We've already tried two iterations of this approach and both failed at the same point: no `paymentToken` is ever injected into the form.

Cardstream's SDK is designed to either:
1. **Auto-submit** the form directly to the gateway (HPP or Direct URL) — card data never touches your server
2. Give you back a **redirect response** from the gateway

It is **not** designed as a "give me a token, I'll call an API myself" pattern (unlike Stripe Elements or Braintree). That's why `autoSubmit: false` + reading `paymentToken` from FormData keeps failing — the SDK simply doesn't work that way.

### What actually works today

You already have a **working** card payment path: `CardstreamPayButton` — it redirects to Cardstream's Hosted Payment Page, processes the card there, and redirects back. This works reliably on all devices.

### Recommended approach

**Use the HPP redirect (`CardstreamPayButton`) for card payments, and keep Apple Pay / Google Pay inline** (those wallet flows work because they use their own tokenization, not Cardstream's SDK).

This means:
1. Replace the inline Hosted Fields card form in `CardstreamCheckout` with `CardstreamPayButton`
2. Keep the Apple Pay and Google Pay buttons as-is (they work via `payment-direct-sale`)
3. Remove jQuery and Hosted Fields SDK loading entirely — no longer needed
4. Result: one component with wallet buttons (inline) + card button (HPP redirect)

### Changes

**`src/components/payments/CardstreamCheckout.tsx`**:
- Remove all Hosted Fields SDK code (jQuery loading, `hostedFields` initialization, `handleCardSubmit`, iframe card inputs)
- Import and render `CardstreamPayButton` in the card section instead
- Keep Apple Pay and Google Pay buttons unchanged
- Remove `sdkReady`, `sdkError`, `cardFormReady`, `formData`, `gatewayUrl` state — no longer needed
- Keep `orderRef` and `merchantId` state for wallet payments only

This gives you a reliable card payment flow immediately, with no SDK fragility.

