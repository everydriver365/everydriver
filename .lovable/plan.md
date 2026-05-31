## Goal
Insert a confirmation/preview step in the "New invoice" dialog so you can review exactly what will be sent before the email goes out.

## Flow
```
Form step  ──►  [Preview invoice]  ──►  Preview step  ──►  [Send invoice]
                                          │
                                          └►  [Back to edit]
```

Currently `Send invoice` calls the edge function directly. After this change, the primary button on the form becomes `Preview invoice` and the actual send only happens from the preview step.

## Preview step contents
A branded, read-only rendering of the invoice that mirrors what the recipient will see:
- Header: "Invoice" + issuer label (instructor business name for instructor scope, "Platform" for admin scope)
- Bill to: recipient name + email (and pupil tag if a pupil was selected)
- Due date + today's issue date
- Line items table: description, qty, unit price, line total
- Service Fee row (only if > 0, labelled exactly "Service Fee" per UK compliance)
- Total in GBP
- Description / note block (if provided)
- Small footer note: "An email with a secure payment link will be sent to {recipient_email} from Square."

Rendered inside the existing `DialogContent` so it stays in one modal (no extra route or new page).

## Step switching
- Local `step` state in `CreateInvoiceDialog`: `"form" | "preview"`.
- `Preview invoice` button validates the form (same checks currently inside `submit`) and switches to `"preview"` on success; validation errors keep the existing toasts.
- Preview step footer: `Back to edit` (returns to form, keeps all values) and `Send invoice` (runs the existing edge-function call).
- Closing the dialog or successful send resets `step` back to `"form"` along with the existing field reset.

## Files touched
- `src/components/invoices/CreateInvoiceDialog.tsx` — add step state, split current body into a form view and a new preview view, move the send call behind the preview's Send button, update the footer buttons per step.

No backend, edge function, or schema changes. No changes to the invoices list page or PDF generator.