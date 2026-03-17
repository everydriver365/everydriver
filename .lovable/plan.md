

## Problem

The mobile booking flow's "Pay Card" button is gated on `gatewayHealth.elavon.available` (line 940 of MobileBookingView), but card payments now use Square. Additionally, the desktop `BookingSummary.tsx` still has a WooCommerce+NPI flow (`handleWooNPIPayment`) that calls the old `npi-checkout` edge function directly.

## Changes

### 1. MobileBookingView.tsx — Fix gateway health check
- Line 940: Change `gatewayHealth.elavon.available` to `gatewayHealth.square.available`
- This enables the card payment button when Square is configured (which it is, per the health check logs)

### 2. BookingSummary.tsx — Fix gateway health checks
- Line 1831: Change `gatewayHealth.elavon.available` to `gatewayHealth.square.available` for the desktop card button
- Lines 1975-1990: Replace the WooCommerce NPI card payment button's `handleWooNPIPayment` handler to use `handleElavonCheckout` (which shows the Square form), or remove the WooCommerce NPI flow entirely since card payments now go through Square

### 3. MobileBookingView.tsx — Update gateway health prop type
- Update the `gatewayHealth` prop interface to include `square` instead of requiring `elavon` for the card button check

### 4. BookingSummary.tsx — Pass `square` health to MobileBookingView
- Ensure `gatewayHealth` passed to MobileBookingView includes Square status

No edge function changes needed — `square-payment` and `square-wallet-config` are already deployed and working.

