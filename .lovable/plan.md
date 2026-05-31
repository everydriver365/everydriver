# Add Klarna as an invoice payment option (parallel to Square)

Square's Invoice API does not support Klarna. We'll keep Square invoices for card/Clearpay and generate a **separate Klarna pay link** for the same invoice when the instructor enables it. The pupil sees both options.

## UX

In `CreateInvoiceDialog`, under the existing **Payment methods** section, add a third toggle:

- **Klarna — pay in 3 / pay later** (off by default)

When enabled at invoice creation:
1. Square invoice is created and published as today (card always, Clearpay optional).
2. A Klarna order session is created via the existing `klarna-session` edge function for the same total and merchant reference (the Square invoice number).
3. The returned Klarna pay URL is stored on the invoice row.

In the invoices list (`SquareInvoicesPage`), if a Klarna link exists on the row, show a small **"Copy Klarna link"** button next to the existing Square "Copy link" action so the instructor can share either option with the pupil.

Gating: the Klarna toggle is only shown when the instructor has Klarna enabled in their payment settings (same flag already used by `PaymentMessaging` / `KlarnaPaymentModal`). If Klarna isn't configured, the toggle is hidden with a small hint linking to payment settings.

## Backend

1. **DB migration** — add to `square_invoices`:
   - `klarna_enabled boolean default false`
   - `klarna_pay_url text`
   - `klarna_order_id text`

2. **`square-invoice-manage` edge function** — extend the `create` action:
   - Accept `klarna_enabled: boolean` in the body.
   - After Square publish succeeds, if `klarna_enabled` is true and the instructor has Klarna credentials, call the internal `klarna-session` (or a small inline equivalent) with the invoice total, currency `GBP`, and `merchantReference = square_invoice_number`.
   - Persist `klarna_pay_url`, `klarna_order_id`, `klarna_enabled` onto the `square_invoices` row.
   - If Klarna creation fails, the Square invoice still succeeds; we log a warning and return a non-fatal `klarna_error` field so the UI can toast it.

3. **Reconciliation** — when the Klarna webhook (already handled by `klarna-order` / `payment-callback`) confirms payment, mark the matching `square_invoices` row paid by `square_invoice_number == merchant_reference`. The Square-side status remains "unpaid" in Square's dashboard; we'll surface a small "Paid via Klarna" badge in our UI so instructors aren't confused.

## Frontend

1. **`CreateInvoiceDialog.tsx`**
   - Add `allowKlarna` state, gated on an `instructorKlarnaEnabled` flag fetched from existing payment settings hook.
   - Add the toggle row beneath Clearpay with the same styling.
   - Pass `klarna_enabled: allowKlarna` to the `square-invoice-manage` create call.

2. **`useSquareInvoices.ts`** — pass `klarnaEnabled` through.

3. **`SquareInvoicesPage.tsx`** — when `row.klarna_pay_url` is set, render an extra "Klarna link" copy button and a small Klarna badge.

## Out of scope

- Adding Klarna as a *native Square* payment method (not supported by Square).
- Building a new Klarna integration — we reuse the existing `klarna-session` / `klarna-order` functions and credentials.
- Splitting the service fee differently for Klarna; existing fee rules apply.
