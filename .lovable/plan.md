

## Add Cardstream Signature Verification to Payment Callback

### What
Add `verifyCardstreamSignature` to the existing NPI/Elavon branch of `payment-callback` to validate that POST data genuinely came from the gateway, preventing forged callbacks.

### Changes

**File: `supabase/functions/payment-callback/index.ts`**

1. Add import for `verifyCardstreamSignature` from `../_shared/cardstream_signature.ts`
2. Inside the `if (provider === "npi" || provider === "elavon")` block (line ~109), after parsing `formData`, add signature verification:
   - Read `NPI_MERCHANT_SECRET` from env
   - Call `verifyCardstreamSignature(formData, secret)`
   - If verification fails, log an error and return a `400` response with "Invalid signature"
   - If verification passes, continue with existing logic

No other providers or functionality are affected. This is a ~10-line addition.

