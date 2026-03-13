

## Simplify Payment Flow — Pupil-Linked Payment Links

### The Problem Today
The current public payment page (`/pay/:instructorId`) is a generic link. The instructor shares it, the payer manually types their name/email, and the payment has no automatic link to a pupil record. The instructor must then manually reconcile who paid.

### Proposed Solution: Pupil-Specific Payment Links

Generate payment links that include the **pupil ID** in the URL, e.g.:

```text
/pay/:instructorId?pupil=:pupilId&amount=50
```

This means:
- The payment page **auto-fills the pupil's name and email** from the database (no typing needed).
- The payment intent is **automatically linked** to the pupil record (`pupil_id` in `payment_intents`).
- On success, the pupil's **account balance is credited automatically** — no manual "Record Payment" step.
- The payer just sees their name, the amount, and the card form. One-tap flow.

### Changes Required

**1. `PaymentLinkShare` component** — Add an optional pupil selector. When a pupil is selected, append `&pupil=:pupilId` to the generated URL/QR code. The component already receives no pupil list, so it will need a `pupils` prop passed from `TakePaymentSheet`.

**2. `TakePaymentSheet`** — Pass the `pupils` array down to `PaymentLinkShare`.

**3. `PublicPaymentPage`** — Read `?pupil=` from URL params. If present, fetch the pupil's name and email from a public-safe view/RPC and pre-fill them (read-only). Pass `pupilId` through to `CardstreamCheckout` so the payment intent is linked.

**4. `payment-intent-create` edge function** — Already accepts `pupilId` and stores it. No change needed.

**5. `payment-direct-sale` edge function** — After a successful sale, if `pupil_id` is set on the intent, call `increment_pupil_balance` to auto-credit the pupil's account. This removes the need for manual reconciliation.

**6. Database** — Create a public-safe view or RPC that returns minimal pupil info (name, email) given a pupil ID + instructor ID, without requiring auth. This prevents data leakage while allowing the payment page to display the pupil's name.

### Resulting UX

**Instructor side:** In "Share Payment Link", optionally pick a pupil and set an amount. The QR/link encodes both. Share it via copy/SMS/QR.

**Pupil side:** Opens link → sees "Pay [Instructor Name] — [Pupil Name] — £50" → enters card details → done. Balance auto-updated.

**Fallback:** If no pupil param, the page works exactly as it does today (generic link, manual name/email entry).

