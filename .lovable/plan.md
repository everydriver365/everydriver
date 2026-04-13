

## Options to Get Kinesis GPS Working

### Option A: Get the correct API key from Kinesis (Recommended)
Contact Kinesis support and ask for:
- **A Fleet API v2 key** for `api.uk1.kt1.io` (the "365" key doesn't work — it may be a dashboard key, not an API key)
- **Your Customer/Owner ID** (needed for API calls)

Draft email you could send:

```text
Subject: API access for Key Telematics Fleet API v2

Hi,

I need programmatic access to our fleet data via the Key Telematics
Fleet API v2 (api.uk1.kt1.io).

Could you provide:
1. A valid API key for the v2 REST API
2. Our Customer/Owner ID for API calls

My account email is kenneth@dufosse.co.uk and we access the
dashboard at kinesisfleetpro.com.

Thanks,
Kenneth
```

Once you have the key, I'll update the `KT_API_KEY` secret and test immediately.

### Option B: Capture a refresh token manually (Quick workaround)
1. Open **kinesisfleetpro.com** in your browser
2. Press **F12** → **Network** tab
3. Log in with your credentials
4. Look for a request to an auth/token endpoint in the network list
5. In the response body, find a field called `refresh` or `refresh_token`
6. Share that value — I'll update the secret and the poller will use it to keep authenticating

### Option C: Wait for account unlock + retry Velocity login
Wait ~30 minutes for the lockout on velocityfleet.com to expire. I'll retry the login with your credentials. This is the least reliable path since it may lock again.

### What I'll do once you have credentials
- Update the relevant secret (`KT_API_KEY` or `RADIUS_REFRESH_TOKEN`)
- Deploy and test the `radius-poller` edge function
- Verify GPS data flows into the `gps_devices` table

