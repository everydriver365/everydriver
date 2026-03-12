

## Plan: Update RADIUS_CUSTOMER_ID and Re-test

**Problem:** The radius-poller gets a 403 "permission denied" because `RADIUS_CUSTOMER_ID` is set to a company name string instead of the numeric ID `8376`.

**Steps:**
1. Update the `RADIUS_CUSTOMER_ID` secret to `8376`
2. Re-invoke the radius-poller edge function to verify it works
3. Report results

No code changes needed — this is purely a secret/config update and test.

