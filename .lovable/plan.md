## Goal

Make Apple Pay work for pupils using the app inside the Despia wrapper, without migrating off Despia or touching Capacitor/Xcode.

## Why the current setup can't show Apple Pay

- Apple Pay on web relies on `ApplePaySession`, a JS API Apple only exposes inside **real Safari**.
- Despia (like TestFlight/Capacitor) hosts the app inside **WKWebView**, where `ApplePaySession` does not exist.
- Square's Web Payments SDK therefore correctly hides the Apple Pay button — there is no code fix inside the WebView that can bring it back.

## Approach: hop out to Safari just for payment

When a pupil taps **Pay Now** *and* we detect we're inside a native wrapper (Despia, Capacitor, etc.), we open the existing Square checkout page in the system browser instead of in the in-app modal. Apple Pay appears because it's now real Safari. After paying, the pupil returns to the app and their balance updates as usual via the existing webhook.

For pupils using the normal web app or PWA in Safari, **nothing changes** — they keep the in-app modal with Apple Pay/card/Google Pay exactly as today.

## What changes in the UI

- Pupil portal **Pay Now** button (`PupilPaymentModal` / `PupilPaymentDrawer` entry points):
  - If `useIsNativeWrapper()` is true → open the hosted payment URL via `window.open(url, '_blank')` (Despia and iOS WKWebView hand this to Safari/SFSafariViewController).
  - Otherwise → keep the existing in-app modal flow.
- Add a small one-line hint under the button when in the wrapper: *"Opens in Safari so you can use Apple Pay."*
- No change to the instructor "Take Payment" sheet — that's a separate flow.

## What does NOT change

- No new dependencies, no Capacitor install, no Xcode work, no Despia rebuild required (Despia already allows external links to open in Safari).
- Square account, webhooks, fee logic, `payment_history`, balance updates, RLS — all untouched.
- Web/PWA pupils keep the current in-app Apple Pay experience.

## Technical notes

- Reuse existing `useIsNativeWrapper()` hook (already detects Despia, Capacitor, iOS WKWebView, Android WebView).
- The hosted URL is the same Square checkout link the app already generates (`paymentLinkBaseUrl` / `getActivePaymentQrUrl`). If a per-amount link is needed, we'll generate it through the existing `square-create-payment-link` edge function before opening Safari.
- On return from Safari, the pupil lands back in the app. The existing realtime balance subscription refreshes `account_balance` automatically — no deep-link handling required.

## Out of scope

- Native Apple Pay sheet *inside* the wrapped app (would require leaving Despia for Capacitor + Square iOS SDK).
- Any change to instructor-side payment collection.
- Any change to non-Square gateways.
