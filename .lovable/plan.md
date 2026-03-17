

## Fix: Embedded Card Form Not Working

### Root Cause (from reading the actual SDK source)

Two critical issues in `CardstreamEmbeddedCardForm.tsx`:

1. **Missing jQuery** - The Cardstream Hosted Fields SDK is a jQuery plugin. It requires jQuery to be loaded first. The project has no jQuery, so the SDK silently fails on load.

2. **Wrong API method** - The code calls `getPaymentToken()` which does not exist. The actual SDK method is `getPaymentDetails()`, which returns `Promise<{success: boolean, paymentToken: string, message?: string}>`.

### Plan

**File: `src/components/payments/CardstreamEmbeddedCardForm.tsx`**

- Load jQuery from CDN before loading the Hosted Fields SDK (jQuery is a hard dependency of the SDK)
- Replace `hostedFormRef.current.getPaymentToken(resolve)` with `hostedFormRef.current.getPaymentDetails()` which returns a proper promise with `{success, paymentToken, message}`
- Listen for `hostedform:ready` event via jQuery on the form element (since the SDK triggers jQuery events, not native DOM events)
- Handle `hostedform:error` and `hostedform:invalid` events for validation feedback

**No backend changes needed** - the `payment-direct-sale` edge function already handles `card_token` method with `paymentToken` correctly. No signature is needed client-side; the SDK handles tokenization internally and the signature is only computed server-side for the Direct API call.

### Execution order
1. Update the `loadScript` calls to load jQuery first, then the SDK
2. Fix the `getPaymentDetails()` call and its response handling
3. Fix event binding to use the jQuery-based event system the SDK expects

