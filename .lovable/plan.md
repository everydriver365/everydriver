

## Fix: "Invalid response from acquirer" (responseCode 65549)

### Root Cause

The most recent gateway response reveals the real problem:

- `responseCode: 65549` / `responseMessage: "Invalid response from acquirer"`
- `threeDSEnabled: Y`, `threeDSCheckPref: authenticated` (merchant-level settings)
- `threeDSRequired: N`, `threeDSCheck: N` (our overrides)

The merchant account (282921) has 3DS set to "authenticated" at the **account level**. When we bypass 3DS with `threeDSRequired: N` / `threeDSCheck: N`, the gateway forwards the transaction to the acquirer (bank) without 3DS authentication data. The acquirer rejects it because the merchant profile mandates 3DS — resulting in "Invalid response from acquirer."

**The tokenize-then-server-side-SALE flow fundamentally cannot support 3DS.** No amount of request field tweaking will fix this. The acquirer requires 3DS authentication, and a server-to-server call cannot perform the browser-based 3DS challenge.

### Solution: Switch to Hosted Fields form submission mode

The Cardstream Hosted Fields SDK supports two modes:
1. **Token mode** (current): `getPaymentDetails()` returns a token → server-side SALE. Cannot do 3DS.
2. **Form submission mode**: The form POSTs directly to the gateway with a `redirectURL`. The gateway handles 3DS natively (inline challenge or redirect), then sends the user back to your callback URL.

Mode 2 keeps the embedded card fields on your page (not HPP) while letting the gateway handle 3DS properly. The user experience is: fill card fields → click Pay → brief 3DS challenge (if required by bank) → redirect back to your site.

### Changes

**File: `src/components/payments/CardstreamEmbeddedCardForm.tsx`**
- Remove the `getPaymentDetails()` tokenization + `payment-direct-sale` server call
- Instead, configure the hosted form with `autoSubmit: false` and include a `redirectURL` hidden field pointing to the `payment-callback` edge function
- Include all necessary transaction fields (`merchantID`, `action`, `amount`, `currencyCode`, `orderRef`, `transactionUnique`, `signature`) as hidden inputs — these must be signed server-side
- On submit, call the SDK's submit method which POSTs directly to the gateway
- The gateway handles 3DS, then redirects to `payment-callback` which already processes Elavon responses

**File: `supabase/functions/payment-intent-create/index.ts`**
- In addition to returning `orderRef`, `merchantId`, etc., also compute and return the full set of signed form fields (including `signature` and `redirectURL`) so the client can embed them as hidden inputs
- This keeps the merchant secret server-side while providing the client with pre-signed form data

**File: `src/components/payments/CardstreamCheckout.tsx`**
- Update to pass the signed form data from `payment-intent-create` to `CardstreamEmbeddedCardForm`
- Remove references to the `payment-direct-sale` function for card payments (wallet payments still use it)

**No changes needed to:**
- `payment-callback` — already handles Elavon/NPI POST responses and redirects
- `payment-direct-sale` — still used for Apple Pay and Google Pay (which provide their own 3DS via wallet tokens)
- `_shared/cardstream_signature.ts` — reused in `payment-intent-create`

### Technical detail

The `payment-intent-create` response will include a new `signedFormFields` object containing all fields needed for the hosted fields form, pre-signed with the merchant secret. The client renders these as hidden inputs inside the hosted fields form. When the user submits, the SDK collects the card data and combines it with the hidden fields to POST directly to `https://gateway.cardstream.com/direct/`. The gateway performs 3DS if required, then redirects to the `redirectURL` (payment-callback).

