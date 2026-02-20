

# Remove All iDeal4Finance References Site-Wide

## Summary

Remove every reference to iDeal4Finance -- imports, logos, badges, and the `showIdeal` prop -- from 7 files across the project.

## Files to Modify

### 1. `src/components/payments/PaymentMessaging.tsx`
- Remove the `showIdeal` prop from both `PaymentMessaging` and `CompactPaymentBadges`
- Remove all iDeal badge markup (the gold `#ffd700` badges)
- Update the JSDoc comment to only mention Klarna and Clearpay

### 2. `src/pages/Index.tsx`
- Remove the `logoIdeal4Finance` import
- Remove the iDeal badge span (`<span>...iDeal</span>`) from the finance options row
- Remove the iDeal4Finance logo `<img>` from the trusted partners section

### 3. `src/pages/BookingSummary.tsx`
- Remove the `ideal4FinanceLogo` import
- Remove the "Ideal4Finance - Provisional Booking" button that uses the logo
- Remove any `showIdeal={false}` prop usage (no longer needed since the prop won't exist)

### 4. `src/pages/MobileHomeDemo.tsx`
- Remove the `logoIdeal4Finance` import
- Remove both `<img>` tags showing the iDeal4Finance logo (partner logos section and footer logos)

### 5. `src/components/MobileHomepage.tsx`
- Remove the `logoIdeal4Finance` import
- Remove the `<img>` tag showing the iDeal4Finance logo in the payment partners row

### 6. `src/components/booking/MobileBookingView.tsx`
- Remove the `ideal4FinanceLogo` import
- Remove the iDeal4Finance logo and provisional booking reference that uses it

### 7. `src/assets/logo-ideal4finance.png`
- Delete the logo asset file (no longer referenced anywhere)

## No Backend Changes

No database or backend changes are needed -- this is purely a frontend cleanup.

