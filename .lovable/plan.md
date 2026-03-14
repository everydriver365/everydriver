

## Fix: Replace Spinning Hosted Fields with Hosted Payment Page Redirect

### Problem
The Cardstream Hosted Fields SDK (which requires jQuery + the `hostedfields.min.js` script) consistently fails to initialize in the Lovable preview environment. The spinner runs indefinitely, and even after prior fixes (jQuery loading, polling, retry button), the SDK still doesn't load reliably. The user confirmed they want a fallback to the hosted payment page.

### Root Cause
The Hosted Fields approach depends on loading two external scripts (jQuery + Cardstream SDK), then initializing a jQuery plugin within an iframe context. This is fragile in sandboxed/preview environments and has proven unreliable across multiple fix attempts.

### Solution
Replace `CardstreamCheckout` (Hosted Fields) with `CardstreamPayButton` (HPP redirect) in the `TakePaymentModal` card entry flow. The HPP approach already exists and works — it calls the `elavon-checkout` edge function, gets signed form data, and auto-submits a hidden HTML form to redirect the user to Cardstream's Hosted Payment Page. No jQuery, no iframes, no SDK needed.

### Changes

**File: `src/components/instructor/TakePaymentModal.tsx`**

1. Replace the `CardstreamCheckout` import with `CardstreamPayButton`
2. Remove the `merchantId` state and `handleProceedToCard` function (no longer needed — the HPP button handles everything in one click)
3. In the "card" view, replace the two-step flow (select pupil + amount → proceed → hosted fields) with: select pupil + amount → show the `CardstreamPayButton` directly
4. Pass `pupilId`, `instructorId`, `customerName`, `amount` (using `totalCharge`) to `CardstreamPayButton`

**File: `src/components/instructor/TakePaymentModal.tsx` — Simplified card view:**
```tsx
{/* Card Entry */}
{view === "card" && (
  <div className="space-y-4">
    {/* Pupil selector (same as before) */}
    {/* Amount input (same as before) */}
    {/* Fee breakdown (same as before) */}
    
    {parsedAmount > 0 && selectedPupilId && (
      <CardstreamPayButton
        amount={totalCharge}
        pupilId={selectedPupilId}
        instructorId={instructorId}
        customerName={selectedPupil?.name}
        onError={(msg) => toast.error(msg)}
      />
    )}
  </div>
)}
```

This removes the `creatingIntent` state, the `handleProceedToCard` async function, and the `merchantId` state entirely — simplifying the component significantly.

### Files to modify
- `src/components/instructor/TakePaymentModal.tsx`

### What stays the same
- The `CardstreamCheckout` component itself remains in the codebase for other pages (PublicPaymentPage, BookingSummary, MobileBookingView) where it may work in production environments outside the preview sandbox
- The `elavon-checkout` edge function already exists and works
- The `payment-callback` edge function handles the return from HPP

