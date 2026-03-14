

## Fix: TakePaymentModal Card Entry — Use Same Payment Flow as Booking

### Problem
The `CardstreamPayButton` (HPP redirect) redirects away from the app to Cardstream's hosted page, which is oversized on mobile and shows Cardstream errors. The user wants the same payment experience used in the booking flow.

### Solution
Replace `CardstreamPayButton` with `CardstreamCheckout` in the TakePaymentModal's card view. This is the same component used in `BookingSummary` and `MobileBookingView` — it uses the Hosted Fields SDK with embedded card inputs directly in the modal, with the existing jQuery loading fix and retry button as fallback.

### Changes

**File: `src/components/instructor/TakePaymentModal.tsx`**

1. Replace `CardstreamPayButton` import with `CardstreamCheckout`
2. In the card view, replace `<CardstreamPayButton>` with `<CardstreamCheckout>`, passing the same props plus a `returnUrl` pointing to a confirmation/success page
3. The `CardstreamCheckout` component already handles SDK loading, retry UI, and embedded card fields inline

```tsx
// Replace CardstreamPayButton with:
<CardstreamCheckout
  amount={totalCharge}
  pupilId={selectedPupilId}
  instructorId={instructorId}
  customerName={selectedPupil?.name}
  customerEmail={selectedPupil?.email || undefined}
  returnUrl={`${window.location.origin}/booking-confirmation?pupilId=${selectedPupilId}&npi=success`}
  onError={(msg) => toast.error(msg)}
  type="balance"
/>
```

If the Hosted Fields SDK still fails to initialize (the retry button scenario), the component already has the fallback retry UI built in. This gives the instructor the same inline card entry experience that pupils see during booking.

### Files to modify
- `src/components/instructor/TakePaymentModal.tsx`

