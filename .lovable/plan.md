## Goal
On the invoices page (instructor scope), show the user's Square connection status, and when not connected gate the "New invoice" flow behind a connect step that offers both **Connect Square** and the existing **affiliate signup link** (`https://squareup.com/i/EVERYDRIVE`).

The pieces already exist:
- `SquareConnectSettings` component handles the full OAuth + disconnect flow and already includes the affiliate signup link with the "free processing on the first £1,000" message.
- `useInstructorAuth()` exposes the current `instructor` object (with `square_merchant_id`, `square_connected_at`) and `refreshInstructor`.
- The `square-invoice-manage` edge function already returns "Connect your Square account before sending invoices" when an instructor without credentials tries to send.

So this is a UI surfacing task — no edge function or schema changes.

## Behaviour

### Admin scope
Unchanged — admin uses the platform Square keys, so no connect step applies.

### Instructor scope
At the top of the invoices page, render a `SquareConnectionBanner` card:

- **Connected** (`square_merchant_id` present):
  - Compact green status row: "Square connected · Merchant {id} · since {date}"
  - Small "Manage" link that expands an inline `SquareConnectSettings` (reconnect / disconnect controls)
  - `New invoice` button stays enabled
- **Not connected**:
  - Heading: "Connect Square to send invoices"
  - One-liner explaining invoices are issued through the instructor's own Square account
  - Two CTAs side-by-side, reusing the same handlers as `SquareConnectSettings`:
    - Primary: `Connect Square account` (calls `square-oauth` `authorize`, opens popup)
    - Secondary: `Create a Square account` → opens `https://squareup.com/i/EVERYDRIVE` in a new tab, plus the existing "free processing on the first £1,000" microcopy
  - `New invoice` button is **disabled** with a tooltip "Connect Square first"

### Refresh after OAuth completes
The existing `SquareCallback` page sends a `postMessage` (or simply updates the DB) when the popup finishes. The banner listens for `window` `message` events of type `square-oauth-success` (matching what `SquareCallback` already emits — confirmed in build mode) and calls `refreshInstructor()` so the banner flips to the connected state without a manual reload.

If no postMessage exists, fall back to polling `instructor.square_merchant_id` every few seconds while the popup is open (Promise-based, stops on connect or after 2 minutes).

## Files

- `src/components/invoices/SquareConnectionBanner.tsx` — new component containing the banner logic above. Reuses connect/disconnect logic by composing `SquareConnectSettings` for the "Manage" expand area, and inlining a slimmer connect CTA + affiliate link for the not-connected state.
- `src/pages/invoices/SquareInvoicesPage.tsx` —
  - When `scope === "instructor"`, fetch the current instructor via `useInstructorAuth()` and render `<SquareConnectionBanner>` above the summary cards.
  - Pass `squareConnected` boolean into `CreateInvoiceDialog` so the button can be disabled when not connected.
- `src/components/invoices/CreateInvoiceDialog.tsx` — add optional `disabled` prop (default `false`); when true, render the trigger button disabled with a `title="Connect Square first"`.

No backend changes, no migrations, no new edge functions. No mobile layout changes (rule: don't touch mobile unless asked) — the banner uses the existing desktop card styling already on the page.