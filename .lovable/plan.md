

## Apple Pay & Google Pay — Already Implemented

Good news: **Apple Pay and Google Pay are already built into your payment flow.** The `SquareWalletButtons` component uses the Square Web Payments SDK to render native Apple Pay and Google Pay buttons. It's already wired into both the mobile payment drawer (`PupilPaymentDrawer`) and the desktop modal (`PupilPaymentModal`).

### How it works today

1. The app fetches your Square credentials via the `square-wallet-config` edge function
2. The Square SDK checks device/browser support and renders the appropriate button (Apple Pay on Safari/iOS, Google Pay on Chrome/Android)
3. On tap, the native payment sheet appears, the user authenticates (Face ID / fingerprint), and a token is returned
4. The token is sent to the `square-wallet-payment` edge function which charges via the Square Payments API
5. The pupil's balance is credited and a receipt is sent

### What you need for it to work on real devices

Your Square secrets are already configured (`SQUARE_APPLICATION_ID`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT`). The key requirements are:

- **Apple Pay**: The domain your app is served on must be **verified with Apple** through your Square Dashboard (Square Dashboard → Apple Pay → Add Domain). This is required for Safari/iOS.
- **Google Pay**: Works automatically in Chrome on Android once Square is in **production** mode. In sandbox mode, Google Pay shows a test card.
- **HTTPS**: Both wallets require HTTPS, which your published URL (`everydriver.lovable.app`) already has.
- **Production mode**: Set `SQUARE_ENVIRONMENT` to `production` when ready to accept real payments.

### Summary

No code changes are needed. To enable on real devices:
1. Set `SQUARE_ENVIRONMENT` to `production` in your secrets
2. Verify your domain (`everydriver.lovable.app` or your custom domain) for Apple Pay in the Square Dashboard
3. Test on an iPhone (Safari) for Apple Pay and an Android phone (Chrome) for Google Pay

