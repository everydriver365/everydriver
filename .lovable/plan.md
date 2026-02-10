

# Update Quartix Credentials and Test Connection

## Overview
Replace all three stored Quartix API credentials with the new values provided by Quartix support, then verify the connection works.

## Steps

### Step 1: Update Secrets
Securely request and store each credential:
- QUARTIX_CUSTOMER_ID
- QUARTIX_USERNAME
- QUARTIX_PASSWORD

### Step 2: Deploy and Test
- Deploy the `quartix-poller` edge function (already written with dual-format auth)
- Call the function to verify authentication succeeds (expecting HTTP 200 with an AccessToken)

### Step 3: Confirm Data Flow
- If auth succeeds, confirm live vehicle positions are being fetched and written to the database
- Report back the number of vehicles found and positions processed

## No Code Changes Required
The edge function already handles both JSON and form-encoded auth attempts, so no code changes are needed -- just the new credentials.

