# Verify Square refund & cancellation events

## What "verify" means here

Confirm that for every Square invoice we issued, these events correctly update both the **invoice record** (`square_invoices`) and **user entitlements** (`pupils.account_balance`, `payment_history`, notifications):

- `invoice.canceled`
- `invoice.refunded`
- `refund.created` / `refund.updated` (refunds applied to an invoice's payment)

## What the code currently does (from `supabase/functions/square-webhook/index.ts`)

| Event | Updates `square_invoices` | Reverses pupil credit | Writes `payment_history` | Notifies |
|---|---|---|---|---|
| `invoice.canceled` | ✅ status=`cancelled`, `cancelled_at` | ❌ no reversal even if it was paid | ❌ | ❌ |
| `invoice.refunded` | ✅ status=`refunded` | ❌ **missing** | ❌ **missing** | ❌ |
| `refund.created/updated` | ❌ does not touch `square_invoices` | ✅ decrements | ✅ negative row | ✅ instructor push |

The `refund.*` handler also matches the original payment by `notes ILIKE %paymentId%`. Instructor-invoice payments are stored with `external_payment_ref = square-invoice:<invoiceId>` and `notes = "Square invoice payment (<invoiceId>)"` — so the Square **payment id** is **not** in those notes, and the refund handler will **fail to find the original row** for any invoice-sourced refund.

## Verification steps (read-only first)

1. **Schema check** — confirm `square_invoices` has `cancelled_at`, `refunded_at`, `refund_amount_cents` columns; confirm `payment_history.external_payment_ref` is the canonical idempotency key.
2. **Replay recent events** — query `webhook_delivery_log` for any `invoice.canceled`, `invoice.refunded`, `refund.created`, `refund.updated` rows in the last 90 days and check whether the matching `square_invoices` / `payment_history` / `pupils.account_balance` rows reflect the event.
3. **Synthetic webhook test** — POST signed payloads to `square-webhook` for: (a) cancel an unpaid invoice, (b) cancel a paid invoice, (c) full refund of a paid invoice via `invoice.refunded`, (d) partial refund via `refund.created` linked to an invoice payment. Confirm DB state after each.

## Gaps to fix

1. **`invoice.refunded`** — add reversal:
   - Look up the matching paid `payment_history` row by `external_payment_ref = square-invoice:<invoiceId>`.
   - Insert a negative `payment_history` row (`payment_type='refund'`, `external_payment_ref = square-invoice-refund:<invoiceId>`, idempotent).
   - `increment_pupil_balance(-amount)` for `recipient_pupil_id`.
   - Set `square_invoices.refunded_at` + `refund_amount_cents` (full amount; partial handled by `refund.*`).
   - Push notification to instructor + pupil.

2. **`invoice.canceled`** — if `row.status === 'paid'`, treat as full refund (same reversal as above) and set status to `refunded` instead of `cancelled`; otherwise keep current cancel behaviour. Add instructor push.

3. **`refund.created` / `refund.updated`** — extend the "find original" lookup so invoice payments are matched:
   - First try `payment_history.external_payment_ref = square:<paymentId>` (Checkout/wallet path).
   - Fallback: fetch payment from Square `/v2/payments/<paymentId>`, read `invoice_id` (or `order_id` → `square_invoices.square_order_id`), then match `payment_history.external_payment_ref = square-invoice:<invoiceId>`.
   - When matched to an invoice, also update `square_invoices` (`status='refunded'` or `'partially_refunded'`, `refunded_at`, `refund_amount_cents += amount`).
   - Switch refund idempotency from `notes ILIKE %Refund <refundId>%` to `external_payment_ref = square-refund:<refundId>`.

4. **Notifications** — emit `notify-parent` + pupil push on refund (mirrors payment-received flow).

## Out of scope

- Backfilling historical refunds that were missed (one-shot script if user wants).
- Rewriting the legacy `notes ILIKE` idempotency for non-refund paths.

## Deliverable

After implementation: re-run the synthetic webhook test for all four scenarios, paste before/after rows from `square_invoices`, `payment_history`, and `pupils.account_balance` to confirm each path is correct and idempotent (replaying the same `event_id` is a no-op via `processed_square_events`).
