The invoice is not sending because the connected Square account token does not currently have the required `CUSTOMERS_WRITE` permission. The latest backend log shows Square rejecting customer creation with:

`INSUFFICIENT_SCOPES: The merchant must authorize your application for CUSTOMERS_WRITE`

The code already requests `CUSTOMERS_WRITE` for new Square connections, so the likely issue is that the existing Square connection was authorised before that scope was added. Existing OAuth tokens do not automatically gain new permissions.

Plan:

1. Update the Square invoice backend error handling
   - Detect Square `INSUFFICIENT_SCOPES` errors when creating/searching customers, orders, invoices, or publishing invoices.
   - Return a clear actionable message instead of the generic “Failed to create Square customer”.

2. Improve the invoice UI feedback
   - When this specific error is returned, show the instructor a message telling them to reconnect Square from the invoice page.
   - Keep the existing send flow unchanged for correctly authorised accounts.

3. Make reconnection the recovery path
   - The existing “Manage” / disconnect-reconnect Square controls can be used to reauthorise Square with the current scope list.
   - After reconnecting, invoice sending should proceed because the new token will include `CUSTOMERS_WRITE`.

Technical detail:

- Current failing endpoint: `square-invoice-manage`
- Current Square rejection: `403 AUTHENTICATION_ERROR / INSUFFICIENT_SCOPES`
- Required scope: `CUSTOMERS_WRITE`
- Existing OAuth scope list already includes `CUSTOMERS_WRITE`, so no new scope needs to be added; the instructor needs a fresh OAuth grant.