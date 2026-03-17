

## Fix: Add cancel button to checkout + auto-fill buyer details on HPP

### Problem
1. **No cancel option**: When `CardstreamCheckout` is shown, the user can't back out. The "Redirecting…" state in `CardstreamPayButton` appears for only 2 seconds before auto-submitting the form. The cancel X exists in code but the window is too brief.
2. **Buyer details not forwarded**: The booking form collects `pupilPhone`, `pupilAddress`, and `pupilPostcode` but doesn't pass them to `CardstreamCheckout`, so the Cardstream HPP page shows empty fields the user has to re-enter.

### Changes

**1. `src/components/payments/CardstreamCheckout.tsx`**
- Add an `onCancel` optional prop
- Render a visible "Cancel" button below the security notice so the user can back out before or during the redirect

**2. `src/components/payments/CardstreamPayButton.tsx`**
- Increase the redirect delay from 2 seconds to 3 seconds so the cancel option is more visible
- Add an `onCancel` prop that's called when the user clicks X, so the parent can react

**3. `src/components/booking/MobileBookingView.tsx`**
- Pass `customerPhone={pupilPhone.trim()}`, `customerAddress={pupilAddress.trim()}`, `customerPostcode={pupilPostcode.trim()}` to `CardstreamCheckout` (lines 936-944)
- Pass `onCancel={onEmbeddedCheckoutCancel}` to `CardstreamCheckout` (removing the separate cancel button below)

**4. `src/pages/BookingSummary.tsx`**
- Same: pass `customerPhone`, `customerAddress`, `customerPostcode` from the booking form state to `CardstreamCheckout` (lines 1928-1947)
- Pass `onCancel={() => setShowHostedFields(false)}` to `CardstreamCheckout` (removing the separate cancel button above)

This ensures all collected buyer details are sent to the HPP for pre-filling, and the user always has a clear way to cancel.

