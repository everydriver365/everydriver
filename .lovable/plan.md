

## Configure Geotab Credentials

Set up three secrets for the Geotab integration:

| Secret | Value |
|--------|-------|
| `GEOTAB_DATABASE` | `THRE04` |
| `GEOTAB_USERNAME` | `info@everydriver.co.uk` |
| `GEOTAB_PASSWORD` | *(you will be prompted to enter this securely)* |

### Steps

1. Store `GEOTAB_DATABASE` with value `THRE04`
2. Store `GEOTAB_USERNAME` with value `info@everydriver.co.uk`
3. Prompt you to securely enter `GEOTAB_PASSWORD` (your MyGeotab login password)
4. Test the connection by calling the `geotab-poller` backend function to verify everything works

No code changes are needed -- the edge functions (`geotab-poller` and `geotab-media-download`) are already built and will use these secrets automatically.

