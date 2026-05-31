## What's happening

Kenneth's invoice (`inv:0-ChD3ECCz78_V-xeZ1thOULPzEPMI`, £2.00, created 10:38 today) is still `unpaid` in our DB even though it's paid in Square.

Looking at `webhook_delivery_log`, Square is delivering `payment.updated` / `payment.completed` events, but **no `invoice.payment_made` events are arriving**. Our webhook already has the right `invoice.payment_made` handler (square-webhook lines 445-502) — the events just aren't being sent.

Two problems compound this:

1. **`payment.updated`** is received but never tries to match a `square_invoices` row. It only matches via `payment_intents`, so invoice payments slip through.
2. The user has no way to force a sync from the UI — Refresh only re-reads our DB.

Separately: this invoice was created with `recipient_pupil_id = null`, so even when we do mark it paid, the pupil-balance credit will be skipped. That's a CreateInvoiceDialog bug to look at after the immediate fix.

## Plan

### 1. Webhook fallback: match invoices via `payment.updated`
In `supabase/functions/square-webhook/index.ts`, inside the existing `payment.completed` / `payment.updated` case, after the `payment_intents` lookup fails, add:
- If `orderId` is set, look up `square_invoices` by `square_order_id = orderId` (only rows with `status != 'paid'` and `deleted_at is null`).
- If found, run the same update + credit logic that `invoice.payment_made` runs (set `status='paid'`, `paid_at=now`, `last_event_at=now`; if `recipient_pupil_id` present and `issuer_type='instructor'`, call `increment_pupil_balance` and insert a `payment_history` row keyed by `external_payment_ref = square:<paymentId>` for idempotency).
- Then `break` so the rest of the payment path doesn't double-process.

This makes paid-invoice auto-update work even without `invoice.*` subscriptions.

### 2. On-demand sync action
Add a new action `sync_status` to `supabase/functions/square-invoice-manage/index.ts`:
- Input: `{ action: "sync_status", invoice_id }`.
- Auth: same as existing actions (instructor/admin own the row).
- Fetches `/v2/invoices/{square_invoice_id}` from Square, maps `status` (`PAID`→`paid`, `CANCELED`→`cancelled`, `REFUNDED`→`refunded`, `UNPAID`→`unpaid`, `PARTIALLY_PAID`→`partially_paid`, `PUBLISHED`→`sent`).
- Updates the `square_invoices` row and runs the same credit-pupil logic on transition into `paid` (idempotent by `external_payment_ref`).

### 3. UI: per-row Sync + auto-sync on Refresh
In `src/pages/invoices/SquareInvoicesPage.tsx`:
- Add a small "Sync" icon button on each non-`paid`, non-`cancelled` row that calls `sync_status` for that invoice, then reloads.
- On the existing Refresh button: after reloading rows, fire `sync_status` in parallel for any rows still `unpaid` / `sent` / `partially_paid` (cap at ~10 to avoid hammering), then reload again. Show a subtle toast if any moved to `paid`.

### 4. Docs/setup note (no code)
At the end of the response, tell the user to add these events to their Square webhook subscription so future invoices auto-update without needing Refresh: `invoice.payment_made`, `invoice.published`, `invoice.updated`, `invoice.canceled`, `invoice.refunded`. The webhook handler already supports all of them.

## Out of scope
- Fixing why `recipient_pupil_id` is null on creation (separate follow-up).
- Backfilling old paid-but-not-synced invoices (the Refresh+sync pass will handle them as soon as the user visits the page).

## Immediate side-effect
Once shipped, hitting Refresh on the invoices page will mark Kenneth's invoice as paid (and credit his balance if `recipient_pupil_id` gets set; otherwise it just marks paid).
