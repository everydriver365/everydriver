

## Add RADIUS_API_TOKEN Secret

### What
Store the Radius/Kinesis API token as a backend secret so the `radius-poller` edge function can authenticate with the Velocity Fleet API and fetch Charlotte's live positions.

### Steps

1. **Add the secret** using the `add_secret` tool with the name `RADIUS_API_TOKEN` — you'll be prompted to paste your token value securely
2. **Test the radius-poller** by calling the edge function to confirm it no longer skips execution and successfully fetches device positions
3. **Verify Charlotte's tracker** shows as online on the tracking page

### No code changes needed
The `radius-poller` already checks for `RADIUS_API_TOKEN` — once the secret is present, it will start working automatically.

