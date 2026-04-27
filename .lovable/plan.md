## Drop orphaned `geotab-poller` cron job

The cron job `jobid: 26` (`invoke-geotab-poller-5s`) is hitting a deleted edge function every 5 seconds, generating ~17,280 failed requests/day. Telemetry continues to work via `radius-poller` (jobid: 28).

### Action

Run a single SQL migration:

```sql
SELECT cron.unschedule(26);
```

### Result

- Stops the 404 spam in edge logs
- Frees ~17k/day of wasted edge function invocations
- No impact on live telemetry (radius-poller remains active)

Approve to switch to build mode and execute.