## QR payments fail — Square rejects raw UK phone numbers

### Root cause

From `square-checkout` edge function logs at the moment the user tried to generate a QR:

```
Square API response: {"errors":[{"code":"INVALID_PHONE_NUMBER",
"detail":"Invalid phone number.","field":"pre_populated_data.buyer_phone_number"}]}
```

Square's Quick Pay API requires `buyer_phone_number` in **E.164** format (e.g. `+447834022410`). Pupils' phone numbers are stored in UK local format (`07834022410`) and the edge function forwards them verbatim, so every QR / payment-link generation request that has a pupil phone number gets a 400 back — and the UI shows "Failed to generate QR code".

This affects:
- The **Take Payment → QR Code** generator
- The **Take Payment → Send Request** flow (when a pupil with a phone is selected)
- Any other caller of `square-checkout` that passes `customerPhone`

### Fix

Edit `supabase/functions/square-checkout/index.ts`:

1. Add a small `normalizePhoneE164(raw)` helper that:
   - Strips spaces, hyphens, brackets.
   - If it starts with `+` and is otherwise digits → return as-is.
   - If it starts with `00` → replace with `+`.
   - If it starts with `07` and is 11 digits (UK mobile) → return `+447` + last 9 digits.
   - If it starts with `7` and is 10 digits → return `+447…`.
   - If it starts with `447` → prefix `+`.
   - Otherwise return `null` (will be omitted from the Square payload — better than a 400).
2. In the `pre_populated_data` block, send `normalizePhoneE164(customerPhone) || undefined` instead of the raw value.

No client-side changes, no DB changes, no schema changes.

### Verification
After deploying:
- Re-run a QR generation with a pupil who has a UK mobile saved → should succeed and return a `checkoutUrl`.
- Logs should no longer show `INVALID_PHONE_NUMBER`.

### Out of scope
- Reformatting stored phone numbers in the `pupils` table (server-side normalization is enough).
- Other Square endpoints — only `square-checkout` is touched.
