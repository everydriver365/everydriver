# Choose Allowed Payment Methods When Creating an Invoice

## Today
`supabase/functions/square-invoice-manage/index.ts` (line 244) hardcodes:
```
accepted_payment_methods: { card: true, square_gift_card: false, bank_account: false }
```
So every Square invoice only accepts card. The user has no choice.

## Goal
Let the instructor pick which methods the pupil can pay with, per invoice. Square's Invoices API supports four flags on `accepted_payment_methods`:
- `card` (debit/credit)
- `bank_account` (ACH — **US only**; not usable for UK GBP invoices, so we hide it)
- `square_gift_card`
- `buy_now_pay_later` (Afterpay/Clearpay — eligibility depends on seller location & invoice amount)

For a UK/GBP driving-school audience the meaningful toggles are **Card** and **Clearpay (BNPL)**. We'll show those two. (Gift cards and ACH are not useful here — leave off by default; we can add later if requested.)

## Scope
- `src/components/invoices/CreateInvoiceDialog.tsx` — add a "Payment methods" section with two toggles (Card, Clearpay). Card defaults on; Clearpay defaults off. Card cannot be turned off (Square requires ≥1 method; we enforce in UI).
- `src/hooks/useSquareInvoices.ts` (or wherever the create call lives) — pass `acceptedPaymentMethods` through to the edge function payload.
- `supabase/functions/square-invoice-manage/index.ts` — accept an optional `accepted_payment_methods` object on the create action and forward it to Square; fall back to `{ card: true }` if absent.
- DB: add `accepted_payment_methods jsonb` column to `square_invoices` so we can display what was offered on each row (read-only badge in the list).

## UX in the dialog
Under the amount/description, a small card:
> **Payment methods**
> - [x] Card (Visa, Mastercard, Amex)
> - [ ] Clearpay — pay in 3 (eligible orders only)
>
> Helper: "Clearpay availability is decided by the buyer's eligibility and the order amount."

## List view
On the invoice rows in `SquareInvoicesPage`, show a tiny "Card • Clearpay" caption next to the amount when `accepted_payment_methods` has more than one entry. Pure UI; no schema impact beyond the new column.

## Implementation notes
1. **Migration**
   ```sql
   ALTER TABLE public.square_invoices
     ADD COLUMN IF NOT EXISTS accepted_payment_methods jsonb;
   ```
2. **Edge function payload (create branch ~line 236)**
   ```ts
   const apm = body.accepted_payment_methods ?? { card: true };
   // ensure card is always true (Square requires at least one)
   apm.card = true;
   payment_requests: [...],
   accepted_payment_methods: apm,
   ```
   After Square returns success, persist `apm` into the new `square_invoices.accepted_payment_methods` column.
3. **Dialog state**
   ```ts
   const [methods, setMethods] = useState({ card: true, buy_now_pay_later: false });
   ```
   Pass through on submit.
4. **Validation**: if everything is off, force `card: true` before sending.

## Out of scope
- ACH/bank transfer (US-only via Square; UK instructors use the existing GoCardless flow instead).
- Square gift cards (not relevant to UK driving schools today).
- Adding Klarna directly into Square invoices (Square doesn't expose Klarna as an invoice payment method — only Clearpay/Afterpay).
