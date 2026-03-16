

## Swap Elavon/Cardstream Credentials

The error `#00065539` ("INVALID CREDENTIALS") means the gateway is rejecting the current `ELAVON_MERCHANT_ALIAS` and/or `ELAVON_SECRET_KEY` values. Since you said it was working before, these may have expired or been rotated on the Cardstream side.

### Plan

1. **Update `ELAVON_MERCHANT_ALIAS`** -- prompt you to enter the correct merchant ID from your Cardstream dashboard
2. **Update `ELAVON_SECRET_KEY`** -- prompt you to enter the correct secret/signature key from your Cardstream dashboard

Both secrets already exist in the backend, so this is just updating their values. No code changes needed.

### Where to find these values
- Log into your **Cardstream** merchant dashboard (or Elavon portal)
- Navigate to your integration/API settings
- Copy the **Merchant ID** (sometimes called "Merchant Alias") and **Signature Key** (sometimes called "Secret Key")
- Make sure you're copying from the correct environment (test vs live)

