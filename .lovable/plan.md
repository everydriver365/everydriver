# Fix: Square invoice has no Pay button on the hosted page

## Symptom
Pupil receives the Square invoice email, opens the hosted Square page, but sees no payment method selector and no Pay button. Card, Clearpay, Klarna and Bank were all toggled on when sending.

## Likely causes (in order of likelihood)
1. **Invoice was published but Square treats it as preview only.** Our `payment_requests[0]` uses `automatic_payment_source: "NONE"` and we never explicitly tell Square the request is buyer-payable. When Square's hosted page renders an invoice where the only request type is `BALANCE` with no `card_payment_methods` or `payment_methods` array on the request, and the merchant location hasn't toggled "Accept invoice payments online", Square hides the Pay button and shows the invoice as view-only.
2. **`accepted_payment_methods` on the invoice currently only sets `card` + `buy_now_pay_later`.** Bank transfer and any other rails are off. If, for this merchant, card is disabled at the Square account level (online card not activated), no method remains and the page becomes view-only.
3. **Invoice status not `UNPAID`/`PARTIALLY_PAID`.** If it lands as `SCHEDULED` (future scheduled date) or `DRAFT` (publish silently failed), the public URL shows a preview without Pay.

## Investigation (read-only, first)
1. Pull the most recent row from `square_invoices` for this instructor — capture `square_invoice_id`, `status`, `public_url`, `accepted_payment_methods` we sent.
2. Call Square GET `/v2/invoices/{id}` with the instructor's token to see Square's authoritative `status`, `accepted_payment_methods`, and `payment_requests[0]`.
3. Open the `public_url` and confirm whether the Pay button is missing because of (a) status, (b) accepted methods, or (c) merchant-level online payments not activated.

## Fix (after diagnosis confirms cause)
Edit `supabase/functions/square-invoice-manage/index.ts` create flow:

- Default `apm.card` stays `true`, but also surface `bank_account: true` when the caller passes it (today bank is hardcoded `false` even when the dialog toggle is on — that is a real bug independent of the Pay-button issue).
- Ensure the publish step actually runs and the response status is `UNPAID`. If Square returns `DRAFT` because `scheduled_at` is unset, omit `scheduled_at` (we already do) and check we send the correct `version` to `/publish`. Log and surface a clear error to the dialog if publish fails so the instructor sees it instead of getting a half-published invoice.
- If diagnosis shows (cause 1) the merchant has not enabled "Accept invoice payments online" in their Square dashboard, the edge function will return a clear actionable error ("Enable online invoice payments in Square → Settings → Invoices") instead of silently sending an unpayable invoice.

## Out of scope
- No UI changes to the Create Invoice dialog (Klarna/Clearpay toggles stay as they are).
- No changes to Klarna pay link generation or the webhook.
- No DB schema changes.

## Deliverable
After the investigation step I will report exactly which cause applies and apply only the minimal code change required, plus add the missing `bank_account` pass-through.
