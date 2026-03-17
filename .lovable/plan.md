

## Fix: "Invalid threeDSCheckPref" error (response code 66354)

### Root Cause
The gateway response clearly shows `responseCode: "66354"` / `responseMessage: "Invalid threeDSCheckPref"`. The value `"not known,not checked,matched,not matched,partially matched"` is not a valid format for the Cardstream gateway — it uses specific short-form values, and this long comma-separated string is being rejected.

### Fix

**File: `supabase/functions/payment-direct-sale/index.ts`** (line 143)

Remove the `threeDSCheckPref` field entirely. Keep only `threeDSRequired: "N"` and `threeDSCheck: "N"` — these two fields are sufficient to instruct the gateway to skip 3DS enrollment for tokenized card payments. Sending an invalid `threeDSCheckPref` is what's causing the rejection before the transaction even reaches the acquirer.

This is a single-line deletion.

