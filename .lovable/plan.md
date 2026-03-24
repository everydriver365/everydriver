

## Add META_APP_SECRET

Store the provided Meta App Secret as `META_APP_SECRET` in the project secrets. This is the final piece needed for the data deletion callback to verify signed requests from Meta.

### Steps
1. Add the secret `META_APP_SECRET` with the value you provided
2. The `meta-data-deletion` edge function will then be fully operational

