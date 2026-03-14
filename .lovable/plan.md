

## Fix: Cardstream HPP doesn't fit mobile screen

### Problem
The `CardstreamPayButton` does a full-page redirect to `https://gateway.cardstream.com/hosted/` — Cardstream's external page is not mobile-friendly at 390px wide, overflows, and shows validation errors.

### Solution
Instead of redirecting the entire page, **embed the HPP inside a responsive iframe** within the existing modal. The form POSTs into a named iframe rather than the main window. The callback redirects back, and we detect success via the iframe URL or `postMessage`.

### Changes

**`src/components/payments/CardstreamPayButton.tsx`**
- Remove the hidden form auto-submit redirect approach
- Add a visible `<iframe>` that fills the container (100% width, ~500px height)
- Set `form.target = "cardstream-hpp-frame"` so the POST loads inside the iframe instead of navigating away
- Add a wrapper div with `overflow-hidden rounded-lg border` for clean containment
- Listen for the iframe's `load` event — when the URL changes to our callback domain (payment-callback redirects to our site), detect success/failure from the redirect URL params and call `onSuccess`/`onError`
- Add a CSS override: inject `<style>` or use `sandbox` attributes to let the HPP render within the constrained space

**`src/components/instructor/TakePaymentModal.tsx`**
- In the `card-entry` view, replace `CardstreamCheckout` (which wraps `CardstreamPayButton`) with a direct `CardstreamPayButton` that renders its iframe inline
- Remove `max-h-[70vh]` constraint for the card-entry view so the iframe has room
- Keep wallet buttons (Apple/Google Pay) as separate options in the picker, since they work inline already

**`src/components/payments/CardstreamCheckout.tsx`**
- Keep wallet buttons (Apple Pay, Google Pay) 
- Replace the `CardstreamPayButton` usage with the new iframe-based version
- OR: split card entry into its own view that just renders the iframe button

### Key technical detail
- The `elavon-checkout` edge function's `redirectURL` currently points to `payment-callback`, which returns an HTML page with a `<meta http-equiv="refresh">` redirect. When loaded inside the iframe, this redirect will change the iframe's `src` to our domain — we can detect this with an `onLoad` handler checking `iframe.contentWindow.location.href` (same-origin at that point) to extract success/failure params.
- `formResponsive: "Y"` is already being sent, which helps the HPP render in a narrower container.

### Flow
1. User clicks "Pay £X.XX" → form POSTs into iframe
2. Cardstream HPP loads inside iframe (constrained to modal width)
3. User enters card details in the iframe
4. On completion, Cardstream POSTs to `payment-callback`, which redirects to our site
5. Iframe `onLoad` fires on our domain → read URL params → detect success → call `onPaid()` and close modal

