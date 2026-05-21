## Square audit — Take Payment & Refund

You (instructor `c9843b58…`) currently have Square OAuth connected (`square_merchant_id` and `square_access_token_encrypted` both set), so all Square checkouts and refunds flow through your own Square account, not the platform account.

### Take Payment

```
[Pay tile] Take Payment
  ├─ QR Code view  ─┐
  └─ Send Request   ├─→ supabase.functions.invoke("square-checkout")
                    │     ├─ uses instructor OAuth token (because connected)
                    │     ├─ uses instructor's first ACTIVE Square location
                    │     ├─ Square Checkout API → /v2/online-checkout/payment-links
                    │     └─ inserts payment_intents row (provider="square_checkout",
                    │        transaction_unique=order_id, status="pending")
                    │
Pupil pays on Square-hosted page
                    │
Square fires webhook → square-webhook
   ├─ HMAC verified (only if SQUARE_WEBHOOK_SIGNATURE_KEY is set — see issue #1)
   ├─ matches payment_intents.transaction_unique = order_id → pupil/instructor
   ├─ idempotency: skips if payment_history.external_payment_ref = `square:{paymentId}`
   ├─ INSERTs payment_history (amount, payment_method="Square",
   │   payout_status="auto_transferred", external_payment_ref="square:{id}")
   ├─ RPC increment_pupil_balance (+amount)
   ├─ inserts instructor_payouts row (auto-paid)
   └─ fires receipt email + push notification + parent notification

Realtime postgres_changes on payment_history
   └─ TakePaymentModal flips to "Received" view + Pay page tiles refresh
```

**Verdict — Take Payment:** correctly wired end-to-end for Square Checkout. Idempotency, balance update, payout record, notifications, and the realtime UI flip all work.

### Refund

```
[Pay tile] Refund → RefundModal
  ├─ Method defaults to "Square" (you're OAuth-connected)
  ├─ Loads pupil's recent Square payments from payment_history
  │   (amount>0, payment_method ilike "square%", not "refunded",
  │    notes containing "ID: …")
  └─ User picks payment, enters amount, submits
        → supabase.functions.invoke("square-refund")
            ├─ verifies caller owns the instructor row
            ├─ requires payment_method starts with "square"
            ├─ extracts squarePaymentId from notes "ID: …"
            ├─ caps at original amount
            ├─ uses instructor OAuth token (else platform token)
            ├─ Square /v2/refunds with idempotency_key
            ├─ INSERTs payment_history (negative, "Square Refund",
            │   payout_status="refunded", notes "Refund {id} for payment {sid}")
            ├─ RPC increment_pupil_balance (−amount)
            └─ marks original row "refunded" or "partially_refunded"

Square fires webhook refund.created/updated → square-webhook
   ├─ idempotency: skips if payment_history.notes ilike `%Refund {refundId}%`
   │   ✅ matches the optimistic insert above — no double-recording
   └─ otherwise records the refund itself
```

**Verdict — Refund:** correctly wired. Optimistic insert + webhook deduplication both work; balance and original-row status both update.

### Issues found

1. **`SQUARE_WEBHOOK_SIGNATURE_KEY` is NOT set** in secrets. `square-webhook` logs `"SQUARE_WEBHOOK_SIGNATURE_KEY not set — skipping signature verification"` and accepts any inbound POST. Any actor that finds the webhook URL can forge `payment.completed` events and credit pupil balances. **Security gap.** Fix: add the secret (from Square Developer Dashboard → Webhooks → your subscription → Signature key).

2. **Platform service fee is NOT collected on OAuth-connected Square payments.** In `square-checkout`, `app_fee_money` is only added if the client passes `platformFeePence`, but neither `TakePaymentModal` (QR or Send Request) sends it. So for you (OAuth-connected):
   - The customer is charged `base + admin fee` (correct, via `totalCharge`).
   - 100% of that lands in your Square account.
   - Platform takes nothing.
   - `square-webhook` also skips its fee/commission branch when `isAutoTransfer` is true (line 218: `if (commConfig && !isAutoTransfer)`), so `platform_commissions` gets no row either.
   In other words: the "Service Fee" the pupil pays is going to you, not the platform. Fix: pass `platformFeePence` from `TakePaymentModal` into `square-checkout` (use the `adminFee` / `fullFee` from `useAdminFee` × 100) so Square's split-payment routes that pence amount to the platform's Square account, AND remove the `!isAutoTransfer` gate on the `platform_commissions` insert so we still log the commission for OAuth payments.

3. **`SQUARE_ENVIRONMENT` must be literally `production` in live** (per project rule). I can't read the value, but it accepts `production`/`prod`/`live`. If it's anything else, all live calls hit sandbox. Worth confirming.

4. **`square-refund` extracts the Square payment id from `notes`** with a regex on `"ID: …"`. That works for rows the webhook inserts today (`"Square Checkout Payment - ID: {id} …"`) and for wallet/booking flows that follow the same convention, but it's fragile. We already store the canonical id in `payment_history.external_payment_ref` (`square:{id}`). Lower priority cleanup: read `external_payment_ref` first, fall back to the notes regex. No bug today, but it'll bite the next time notes wording is changed.

5. **Realtime "Payment Received" view in `TakePaymentModal`** subscribes to *any* new positive `payment_history` row for the instructor — not specifically the one created for this checkout. If another payment lands while the QR is on screen, the modal will flip to "Received" for the wrong amount. Minor UX edge case; would need filtering by `external_payment_ref` matching the just-created `order_id` to be precise.

### What's correct and needs no change

- OAuth token selection (instructor's vs platform's), location auto-discovery, idempotency keys, currency (GBP), pence rounding.
- `payment_intents` write before redirect so the webhook can match.
- Webhook → `payment_history` + `increment_pupil_balance` + `instructor_payouts` + receipt + push + parent notification chain.
- Refund optimistic insert + webhook dedupe.
- Owes Money / Credit on Account / Payments This Month / hero earnings now all refresh on the realtime event (from your previous fix).

## Plan

Tackle in this order. Each item is independent.

### A. Close the webhook spoofing gap (must-do)

1. Ask you to fetch the Signature Key from Square Developer Dashboard → Webhooks → your subscription.
2. Add it as the runtime secret `SQUARE_WEBHOOK_SIGNATURE_KEY` (I'll trigger the secret-request tool, you paste the value).
3. No code change — the verifier is already in place; it just no-ops without the key.

### B. Collect platform service fee on OAuth Square payments (functional fix)

In `src/components/instructor/TakePaymentModal.tsx`, pass the pence-equivalent of the platform's share of the admin fee to `square-checkout`:

- Send Request flow (`handleSendLink`) — when `parsedAmount > 0` and `hasFee`, add `platformFeePence: Math.round(adminFee * 100)` to the invoke body.
- QR flow — same with the `qrFee` values.

`square-checkout` already wires `platformFeePence` → `app_fee_money` on OAuth payments; no edge-function change needed there.

In `supabase/functions/square-webhook/index.ts` (line ~218), drop the `!isAutoTransfer` guard for the `platform_commissions` insert so OAuth payments still log a commission row. The `payment_history` credit stays at the full `creditAmount` because OAuth payouts settle gross to the instructor and Square moves the app-fee to the platform separately — the commission table is the audit record.

### C. Make `square-refund` source the payment id from `external_payment_ref`

In `supabase/functions/square-refund/index.ts`, after loading `original`, prefer `original.external_payment_ref?.replace(/^square:/, "")` and only fall back to the notes regex. Also include `external_payment_ref` in the `.select(...)`. No behavioural change today; future-proofs the refund path.

### D. Tighten the modal's realtime listener (small UX)

Store the `order_id` returned by `square-checkout` in component state, and in the realtime handler only flip to "Received" when the inserted `payment_history.external_payment_ref === \`square:\${paymentId}\`` AND we can match it back to that order. Or, simpler: subscribe to `payment_intents` UPDATE where `transaction_unique` matches our stored `order_id` and `status` flips to "paid".

### Out of scope

- No DB migrations.
- No changes to `square-oauth`, `square-wallet-payment`, `square-booking-wallet-payment`, `square-create-subscription` (separate flows).
- No change to the existing notes-based legacy match in `square-webhook` (kept as a fallback).
