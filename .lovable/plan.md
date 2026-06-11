## Why payments still look like "Square"

Short answer: live card payments are already going through **Ryft**, not Square. What's left are a few stale references that make it look like Square is still in play:

### What's actually happening today
- **Pupil card payments** (`PupilPaymentModal` → "Pay by Card") → `ryft-create-checkout` ✅
- **Instructor "Take Payment" modal** → `ryft-create-checkout` ✅
- **PupilPaymentsManager** payment links → `ryft-create-checkout` ✅ (only the `console.error` text still says "square-checkout failed")
- **Public partner payment** (`public-start-payment`) → already maps `method: "square"` to `ryft-create-checkout` ✅
- **Klarna / Clearpay** → still their own gateways (intentional)

### What is genuinely still calling Square
1. **`src/components/parent/ParentPaymentTopUp.tsx`** — the parent top-up button invokes `pupil-payment-checkout` with `paymentMethod: "square"`. This is the only user-facing flow that still references Square as a gateway. It also uses the wrong field name (`paymentMethod` vs the function's `gateway` switch), so it likely fails on click.
2. **`src/components/instructor/TakePaymentModal.tsx`** — comments, the realtime listener key (`square:` ref prefix), and toast/log copy still say "Square". The actual checkout call goes to Ryft, but webhook-driven realtime "received" flip is keyed on the old `square:` ref prefix written by `square-webhook` — if a payment lands via `ryft-webhook` the modal won't auto-flip.
3. **`src/components/instructor/PupilPaymentsManager.tsx`** — only a stale `console.error("square-checkout failed…")` and a toast string. Cosmetic.
4. Edge functions `square-checkout`, `square-webhook`, `square-wallet-config` are still deployed and referenced in `payment-health`, `usePaymentGatewayHealth`, school gateway UI, etc.

## Proposed cleanup

### Code changes
1. **ParentPaymentTopUp** — switch to the same Ryft flow used by `PupilPaymentModal` (`ryft-create-checkout` with `serviceFeePence`, redirect to `data.checkoutUrl`). Removes the broken `paymentMethod: "square"` call.
2. **TakePaymentModal** — replace the realtime listener's `square:` ref-prefix check with the equivalent Ryft signal (match by `payment_history.method = 'ryft_card'` + order ref, or listen on `ryft_payment_intents`). Update comments/toasts to say "Card" instead of "Square".
3. **PupilPaymentsManager** — change the stale log/toast strings to neutral "card payment link" wording.

### Optional follow-ups (ask before doing)
- Retire `square-checkout` / `square-wallet-config` edge functions and drop `square` from `payment-health` + `usePaymentGatewayHealth` + `SchoolPaymentGatewaysSection`. Keep `square-webhook` only if historic Square payments still need to settle; otherwise retire it too.
- The school-side UI ("Use DSM Square Account", Square logo tile) still markets Square as the platform processor — needs a copy/branding pass to say Ryft (or "platform card processing").

### Out of scope
- Klarna and Clearpay flows (unchanged).
- Historic Square payment history rows (left as-is for audit).

Want me to do just the 3 code changes in step 1–3, or also the optional retirement + school UI rebrand?
