

# Fix: Klarna Payment Not Working

## Root Cause

The current Klarna integration uses the **client-side Klarna Payments Buttons SDK** (`KlarnaExpressButton`), which requires the serving domain to be explicitly whitelisted in the Klarna Merchant Portal. On the current domain (`everydriver.lovable.app` or the preview URL), the SDK either fails to load `Klarna.Payments.Buttons` or the `load()` callback returns `show_button: false`, rendering the button as "Klarna unavailable."

There is already a working **server-side Klarna Checkout flow** (`handleKlarnaCheckout` → `klarna-checkout` edge function) that creates a Klarna Checkout v3 order and redirects the user to Klarna's hosted payment page. This flow does NOT require domain whitelisting — it works from any domain.

## Solution

Replace the unreliable `KlarnaExpressButton` (client-side SDK) with a simple styled button that triggers the existing `handleKlarnaCheckout` server-side redirect flow. This is the same approach used for Clearpay and is far more reliable.

### Changes

#### 1. BookingSummary.tsx (desktop view, ~lines 1892-1931)
Remove `KlarnaExpressButton` component usage. Replace with a simple `<button>` that calls `handleKlarnaCheckout()` — matching the Clearpay button pattern. Show loading state via `isKlarnaLoading`.

#### 2. MobileBookingView.tsx (~lines 961-977)
Same change: replace `KlarnaExpressButton` with a button calling `onKlarnaCheckout` (a new prop passed from BookingSummary). Add `onKlarnaCheckout` and `isKlarnaLoading` to the component's props.

#### 3. BookingSummary.tsx — pass new props to MobileBookingView
Pass `onKlarnaCheckout={handleKlarnaCheckout}` and `isKlarnaLoading` to `MobileBookingView`.

#### 4. Clean up
- Remove the `KlarnaExpressButton` import from both files (the component file can remain for future use).
- Remove unused `klarna-session` and `klarna-order` edge functions if desired (optional, no impact).

### Files Modified
- `src/pages/BookingSummary.tsx` — replace express button with redirect button, pass props
- `src/components/booking/MobileBookingView.tsx` — replace express button with redirect button, accept new props

