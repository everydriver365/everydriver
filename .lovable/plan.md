

## Restore Embedded Card Entry via Cardstream Hosted Fields

### Why the redirect approach is poor
Redirecting to Cardstream's HPP takes users off your app, breaks the flow on mobile, and feels unprofessional. The embedded Hosted Fields SDK injects secure iframes into your own form — card details never touch your server, but the experience stays in-app.

### Why it failed before
The previous implementation manually called `getPaymentDetails()` but the `merchantID` was empty and the form wasn't correctly wired. The SDK has an `autoSubmit` mode that handles everything automatically: validation, tokenization, and form submission.

### Plan

**File: `src/components/payments/CardstreamCheckout.tsx`**

Replace the HPP redirect card flow with a properly implemented Hosted Fields form:

1. **Load jQuery + SDK** — Use `loadScript` to load jQuery first, then `https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js`
2. **Get signed form data** — Call `elavon-checkout` edge function to get the `merchantID`, `signature`, and all required fields (already returns these)
3. **Render an HTML form** containing:
   - Hidden inputs for `merchantID`, `action`, `amount`, `signature`, etc. (all the signed fields from the edge function)
   - A visible `<input type="hostedfield:cardDetails">` element (single combined card field with number + expiry + CVV)
   - The form's `action` set to the Cardstream Direct URL
   - The form's `method` set to POST
4. **Initialize the SDK** using `window.hostedFields.classes.Form(formElement, { autoSetup: true, autoSubmit: true })` — this tells the SDK to:
   - Auto-detect `hostedfield:` typed inputs and inject secure iframes
   - On form submit: validate → call `getPaymentDetails()` → inject `paymentToken` → submit the form to the Direct endpoint
5. **Style the hosted field** using a `<style class="hostedfield">` tag with CSS that matches the app's design
6. **Handle the response** — The form submits to the `redirectURL` (our `payment-callback` edge function), which redirects back to the app on success

**File: `supabase/functions/elavon-checkout/index.ts`**

Small update to also return the Direct URL and ensure the `redirectURL` points to our callback correctly. The current function already generates all the signed fields needed.

**Keep wallet buttons** (Apple Pay / Google Pay) as-is — they work independently.

### Key technical details
- The SDK requires jQuery loaded before it
- The `<input type="hostedfield:cardDetails">` is the single-line combined field (card number + expiry + CVV in one)
- The SDK's `autoSubmit` handles the `getPaymentDetails()` → `paymentToken` flow automatically, eliminating the manual tokenization that was failing
- The `merchantID` must match the `ELAVON_MERCHANT_ALIAS` secret — already returned by the edge function
- CSS for the iframe content is passed via a `<style class="hostedfield">` tag that the SDK parses

