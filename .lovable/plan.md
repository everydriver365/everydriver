

## Auto-Scrape Test Slots Every 12 Hours

### What This Does
Sets up an automatic scrape of the test booking site every 12 hours. When a test slot is found at a centre that matches any instructor's active "want test" request (regardless of date/time), it will:
- Insert a `scraped_match` record into the database
- Trigger the notification bell in the app
- Send an SMS alert to the admin

### Implementation Steps

**1. Update the scrape-test-slots backend function**

Add a new `mode: 'auto'` path that:
- Queries all active `want_test` requests to get the list of desired centre names
- Scrapes each requested centre one by one using the existing scrape logic
- Runs the matching logic against all found slots (matching by centre name only, ignoring date/time)
- Inserts `scraped_match` records and sends SMS alerts as it already does

When called with no body or `{"mode": "auto"}`, it will automatically determine which centres to scrape based on active requests.

**2. Create a scheduled job (every 12 hours)**

Add a `pg_cron` job that calls the `scrape-test-slots` function with `{"mode": "auto"}` at 7am and 7pm daily (every 12 hours).

**3. No changes needed to the notification hook**

The existing `useTestSwapNotifications` hook already picks up `scraped_match` records and shows the bell badge -- no changes required there.

### Technical Details

- The edge function will iterate through each unique centre name from active `want_test` requests
- Each centre requires a separate Firecrawl scrape call (the site requires selecting a centre from a dropdown)
- The matching is centre-name only (as requested -- any date/time at the right centre triggers an alert)
- Duplicate detection prevents the same slot from being inserted twice
- The cron schedule `0 7,19 * * *` runs at 7:00 AM and 7:00 PM UTC daily

