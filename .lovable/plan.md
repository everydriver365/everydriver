

## Fix: Square SDK Environment Mismatch

**Problem**: The `SQUARE_ENVIRONMENT` secret is set to `sandbox`, but the `SQUARE_APPLICATION_ID` is a production application ID. This causes the SDK to load the sandbox JS (`sandbox.web.squarecdn.com`) but fail when initialized with a production app ID.

**Evidence**: Console logs show `ApplicationIdEnvironmentMismatchError` and the `square-wallet-config` response confirms `environment: "live"` — but both `SquareWalletButtons.tsx` and `SquarePaymentForm.tsx` also have their own SDK initialization paths that may be reading the environment differently, or there's a second config fetch path.

Looking at the code:
- `square-wallet-config` edge function reads `SQUARE_ENVIRONMENT` and returns it — the network response shows `"environment":"live"`, so the config function is correct.
- `SquarePaymentForm.tsx` likely has its own SDK init that may use a different config source.

**Fix**: Update the `SQUARE_ENVIRONMENT` secret from `sandbox` to `production` (or `live`). The `square-wallet-config` already returns `"live"` so the wallet buttons should work — the error is likely coming from `SquarePaymentForm.tsx` which may have a separate config fetch. I need to check that file's init logic to confirm both components use the same config endpoint.

**Action**: Update the `SQUARE_ENVIRONMENT` secret value to `production` to match the production application ID, ensuring both the card form and wallet buttons load the production Square SDK.

