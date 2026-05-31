# Soft-delete invoices

Add the ability to remove an invoice from the instructor/admin Invoices list without losing the underlying record or Square history.

## Behaviour

- Each invoice row gets a **Delete** action (in the row's overflow menu).
- Clicking it opens a **confirmation dialog** ("Delete this invoice? It will be hidden from your list but kept for your records and on Square.") with **Cancel / Delete** buttons.
- On confirm: stamps `deleted_at = now()` and `deleted_by = auth.uid()` on `square_invoices`. The Square invoice itself is **not** cancelled — this is a local hide only.
- Deleted invoices disappear from the list immediately (we filter `deleted_at IS NULL`).
- **Guard:** paid invoices cannot be deleted (so pupil balance / payment_history stays auditable). The menu item is disabled with a tooltip "Paid invoices cannot be deleted". Admins can still delete paid ones.
- No new "Trash" view in this pass — restore is admin-only via DB if needed. Can add a Trash tab later if you want.

## Technical

1. **Migration** — add to `public.square_invoices`:
   - `deleted_at timestamptz`
   - `deleted_by uuid`
   - partial index `(issuer_instructor_id) WHERE deleted_at IS NULL`
   - RLS: add update policy allowing the issuing instructor (via `get_instructor_id_for_user(auth.uid())`) to set `deleted_at`, and admins to soft-delete any.

2. **`SquareInvoicesPage.tsx`**
   - Add `.is("deleted_at", null)` to the load query.
   - Add row action → `AlertDialog` confirm → `update({ deleted_at: new Date().toISOString(), deleted_by: user.id })`.
   - Optimistic remove from `rows`, toast on success/failure.
   - Hide/disable the action for `status === 'paid'` unless `scope === 'admin'`.

3. No edge-function changes. Webhook continues to update the row by `square_invoice_id` even when soft-deleted (so if a late payment lands, the record stays consistent — just hidden).

## Out of scope

- Hard delete / purge.
- Restore UI (DB-only for now).
- Cancelling the invoice on Square (separate "Cancel" action already exists / can be added separately).
