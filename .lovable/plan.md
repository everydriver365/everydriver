

## Fix: GoCardless Environment Secret Contains Wrong Value

**Root cause** (confirmed from edge function logs): The `GOCARDLESS_ENVIRONMENT` secret currently contains the GoCardless access token string (`live_1xrsVwjGm23PCnCn...`) instead of the simple word `live`. The code lowercases this and checks if it equals `"live"`, `"production"`, or `"prod"` -- it doesn't match any, so `isLive = false` and it calls the sandbox API with a live token, causing the 401 error.

**Fix**: Update the `GOCARDLESS_ENVIRONMENT` secret value to just `live` (the word, not the token). No code changes needed -- the code logic is correct, the secret value is wrong.

**Affected functions** (all will be fixed by this single secret change):
- `gocardless-instant-bank-pay`
- `gocardless-pupil-mandate`
- `gocardless-create-billing-request`
- `gocardless-webhook`
- `process-recurring-subscriptions`

