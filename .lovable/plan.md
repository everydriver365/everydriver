

## Plan: Fix Cardstream Hosted Fields Signature Mismatch

### Root Cause

The `handleSubmit` in `CardstreamEmbeddedCardForm.tsx` calls `e.preventDefault()` which stops the form from ever actually submitting to the gateway. Then `$form.trigger("submit")` re-fires the submit event which gets caught by React's `onSubmit` handler again — the form never posts. The SDK never gets a chance to inject card data, so the gateway receives fields without card data, returns an error, and the callback signature check fails on that error response.

### Changes

**1. `supabase/functions/payment-intent-create/index.ts`** — Already correct after previous fix. Single `formFields` object, conditional billing fields, signed once. No changes needed.

**2. `src/components/payments/CardstreamEmbeddedCardForm.tsx`** — Fix the submission flow:

- Set form `action` and `method` as HTML attributes directly on the `<form>` element (not via jQuery after mount), so they exist before the SDK initializes
- Remove `onSubmit={handleSubmit}` from the form — the SDK needs to intercept the native submit event without React blocking it
- On "Pay" button click, use `instanceRef.current.submitForm()` to let the SDK handle tokenization and form submission
- If `submitForm()` is not available on the instance, fall back to native `formRef.current.submit()` which will post the form directly (the SDK should have set up its interception by this point)
- Remove the `$form.trigger("submit")` approach which conflicts with React's event system
- Do not add, remove, or modify any hidden fields on the frontend — render exactly what `signedFormFields` contains

**3. `supabase/functions/payment-callback/index.ts`** — No changes needed. Already logs raw response before signature check.

### Technical Detail

The key change in the card form component:

```tsx
// Form element — action/method set as static attributes, no onSubmit handler
<form ref={formRef} action={gatewayUrl} method="POST" className="space-y-3">

// Pay button — type="button" (not submit), click handler calls SDK
<Button type="button" onClick={handlePay} ...>

// handlePay function:
const handlePay = () => {
  if (instanceRef.current?.submitForm) {
    instanceRef.current.submitForm();
  } else {
    formRef.current?.submit(); // native submit, SDK intercepts via its own listener
  }
};
```

This ensures:
- The form action points to the gateway from the start
- The SDK's own event listeners are not blocked by `preventDefault()`
- Hidden fields match the signed payload exactly
- Card data is tokenized by the SDK before submission

### Files Modified
- `src/components/payments/CardstreamEmbeddedCardForm.tsx`

### What Stays the Same
- Apple Pay → `payment-direct-sale` (unchanged)
- Google Pay → `payment-direct-sale` (unchanged)
- `payment-intent-create` edge function (already correct)
- `payment-callback` edge function (already correct)
- No HPP fallback — remains fully embedded

