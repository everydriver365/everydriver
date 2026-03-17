

## Plan: Fix Cardstream 66343 Invalid Signature

### Root Cause (two issues)

**Issue 1: Keys must be sorted.** The Cardstream gateway signature algorithm requires fields sorted alphabetically. The previous change removed `.sort()`, breaking the signature.

**Issue 2: Signature/form field mismatch.** The form includes customer fields (`customerName`, `customerEmail`, `customerAddress1`, `customerPostcode`, `customerCountryCode`) but the signature only covers 9 core fields. The gateway recomputes the signature over ALL received fields (excluding `signature`), so extra unsigned fields cause a mismatch.

### Changes

**1. `supabase/functions/_shared/cardstream_signature.ts`** — Restore `.sort()`:
```typescript
// Line 19: change back to sorted
const sortedKeys = Object.keys(data).sort();
```

**2. `supabase/functions/payment-intent-create/index.ts`** — Use ONE object for both form fields and signature. Remove the separate `signatureFields` object. Sign the complete `formFields` object (including any customer fields present):
```typescript
const formFields: Record<string, string> = {
  merchantID: merchantId,
  action: "SALE",
  type: "1",
  countryCode: "826",
  currencyCode: "826",
  amount: String(amountPence),
  orderRef,
  transactionUnique,
  redirectURL: callbackUrl,
};

if (body.customerName) formFields.customerName = body.customerName;
if (body.customerEmail) formFields.customerEmail = body.customerEmail;
if ((body as any).customerAddress) formFields.customerAddress1 = (body as any).customerAddress;
if ((body as any).customerPostcode) {
  formFields.customerPostcode = (body as any).customerPostcode;
  formFields.customerCountryCode = "826";
}

// Sign ALL form fields with one object — no separate signatureFields
formFields.signature = await createCardstreamSignature(formFields, merchantSecret);
```

**3. Deploy** all edge functions that use the shared signature helper: `payment-intent-create`, `payment-callback`, `payment-direct-sale`, `elavon-checkout`, `npi-checkout`.

**4. No frontend changes needed** — the component already renders `signedFormFields` exactly as received.

### Why this works

The gateway receives the form POST, strips the `signature` field, sorts the remaining fields alphabetically, builds the query string, appends the merchant secret, and hashes with SHA-512. If our signature is computed over exactly the same set of fields (sorted, same encoding), it matches. The Hosted Fields SDK adds card data fields which the gateway excludes from signature verification (they are tokenized/injected fields).

