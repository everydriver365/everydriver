

## Fix: Remove HPP fallback and resolve 3DS error for embedded card payments

### Problem
1. The `CardstreamCheckout` fallback (lines 328-356) redirects to the Hosted Payment Page (HPP) when the embedded form encounters an error — this is not wanted.
2. The 3DS error persists despite `threeDSRequired: "N"` being set. The gateway response shows `threeDSCheckPref: "authenticated"` and `threeDSEnabled: "Y"` at the merchant account level, which overrides the request-level `threeDSRequired` field.

### Root cause of 3DS failure
The gateway field `threeDSRequired` alone doesn't override the merchant-level `threeDSCheckPref: "authenticated"`. Additional fields are needed to instruct the gateway to skip 3DS for tokenized card payments where 3DS cannot be performed server-side.

### Plan

**File: `supabase/functions/payment-direct-sale/index.ts`**
- For `card_token` method, add these gateway fields alongside the existing `threeDSRequired: "N"`:
  - `threeDSCheck: "N"` — explicitly disables the 3DS enrollment check
  - `threeDSCheckPref: "not known,not checked,matched,not matched,partially matched"` — overrides the merchant-level preference to accept any 3DS result including "not checked"

**File: `src/components/payments/CardstreamCheckout.tsx`**
- Remove the HPP redirect fallback entirely (lines 328-356 calling `cardstream-hosted-redirect`)
- When `embedFailed` is true, show a user-friendly error message with a retry option (re-mount the embedded form) instead of redirecting to HPP
- Keep the embedded card form as the sole card payment method

No other files need changes.

