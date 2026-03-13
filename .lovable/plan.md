

## Route Apple Pay and Google Pay Through Elavon (Cardstream)

### Current State
- **CardstreamCheckout** already has Apple Pay built in (native `ApplePaySession` API → `payment-direct-sale` with `method: "apple_pay"`). It works on the public payment page and booking flows.
- **Google Pay** is NOT yet implemented via Elavon — only via Square's `SquareWalletButtons`.
- The pupil portal payment drawer/modal uses `SquareWalletButtons` for wallet payments.
- Booking flows (`BookingSummary`, `MobileBookingView`) use `CardstreamCheckout` for card entry but don't surface Apple/Google Pay buttons separately — Apple Pay is already embedded inside `CardstreamCheckout`.

### What Needs to Change

**1. Add Google Pay to `CardstreamCheckout`**
- Use the native Google Pay JS API (`google.payments.api.PaymentsClient`) alongside the existing Apple Pay.
- Configure with gateway `"cardstream"` and `gatewayMerchantId` set to the Elavon merchant alias (already returned by `payment-intent-create`).
- On tokenization, send the Google Pay token to `payment-direct-sale` with `method: "google_pay"`.

**2. Update `payment-direct-sale` edge function**
- Add `"google_pay"` as a valid `PayMethod`.
- When method is `google_pay`, set `paymentMethod: "googlepay"` and `paymentToken` to the Google Pay token string, mirroring how Apple Pay works.

**3. Replace `SquareWalletButtons` with Elavon wallet buttons**
- Create a new `ElavonWalletButtons` component that renders standalone Apple Pay and Google Pay buttons backed by `payment-intent-create` + `payment-direct-sale`.
- Replace `SquareWalletButtons` usage in `PupilPaymentDrawer` and `PupilPaymentModal` with `ElavonWalletButtons`.
- Same props interface (amount, pupilId, instructorId, etc.) for drop-in replacement.

**4. Ensure booking flows show wallet options prominently**
- In `BookingSummary` and `MobileBookingView`, add `ElavonWalletButtons` above or alongside the "Pay by Card" button (before `CardstreamCheckout` is opened), so users see Apple/Google Pay as express options on the booking payment step.
- When a wallet payment succeeds, navigate to the booking confirmation page the same way the card payment does.

### Technical Details

**Google Pay configuration:**
```text
gateway: "cardstream"
gatewayMerchantId: <ELAVON_MERCHANT_ALIAS from payment-intent-create>
allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"]
tokenizationSpecification.type: "PAYMENT_GATEWAY"
```

**payment-direct-sale changes:**
- Add `googlePayPaymentToken` field to request interface.
- Add `google_pay` method branch: set `paymentMethod: "googlepay"`, `paymentToken: body.googlePayPaymentToken`.

**ElavonWalletButtons component:**
- Calls `payment-intent-create` on mount to get `orderRef` + `merchantId`.
- Renders native Apple Pay button (if `ApplePaySession.canMakePayments()`) and Google Pay button (via Google Pay JS API).
- On payment authorized → calls `payment-direct-sale` → on success, triggers `onPaid` callback.
- Shares the same auto-balance-credit logic already in `payment-direct-sale`.

**Files to create/modify:**
- Create: `src/components/payments/ElavonWalletButtons.tsx`
- Edit: `supabase/functions/payment-direct-sale/index.ts` (add Google Pay method)
- Edit: `src/components/pupil-portal/PupilPaymentDrawer.tsx` (swap Square → Elavon)
- Edit: `src/components/pupil-portal/PupilPaymentModal.tsx` (swap Square → Elavon)
- Edit: `src/pages/BookingSummary.tsx` (add wallet buttons to payment step)
- Edit: `src/components/booking/MobileBookingView.tsx` (add wallet buttons to payment step)

No database changes needed. No new secrets needed (Google Pay via Cardstream uses the existing `ELAVON_MERCHANT_ALIAS`; Apple Pay uses existing `applepay-validate-merchant` function).

