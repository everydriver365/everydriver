

## Make Elavon the Default Payment Gateway

### What Changes

Switch all card payment flows from the NPI Cardstream merchant to the Elavon Cardstream merchant. Both use the same Cardstream HPP infrastructure — only the merchant credentials differ.

### Approach

Rather than maintaining two near-identical edge functions, update `CardstreamPayButton` and the booking flows to call `elavon-checkout` instead of `npi-checkout`. The `elavon-checkout` function also needs upgrading to match `npi-checkout`'s maturity (payment intent recording, callback URL, shared signature helper).

### Changes

| File | Change |
|------|--------|
| `supabase/functions/elavon-checkout/index.ts` | Upgrade to match `npi-checkout`: use shared `createCardstreamSignature`, record `payment_intents`, use `payment-callback` as `redirectURL` with `provider=elavon`, support `formResponsive`, `merchantName`, `type`, customer fields |
| `src/components/payments/CardstreamPayButton.tsx` | Change edge function call from `npi-checkout` to `elavon-checkout` |
| `src/hooks/usePaymentGatewayHealth.ts` | Update UI to check `elavon` availability instead of `npi` for the card payment button enabled state |
| `src/components/booking/MobileBookingView.tsx` | Change gateway health check from `gatewayHealth.npi.available` to `gatewayHealth.elavon.available` |
| `src/pages/BookingSummary.tsx` | Change desktop card button to use Elavon by default (already has `handleElavonCheckout`, just make it the primary card option) |
| `supabase/functions/payment-callback/index.ts` | Ensure callback handles `provider=elavon` (likely already works since it's the same Cardstream response format) |

### Payment Callback

Need to verify `payment-callback` handles Elavon responses — since both NPI and Elavon use Cardstream HPP, the response format is identical. The callback just needs to accept `provider=elavon` in addition to `provider=npi`.

