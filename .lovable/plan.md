

## Problem: Square QR Payments Not Recording

### Root Cause (two issues)

**1. Square webhook not receiving events**
The `square-webhook` edge function logs are empty — Square is not sending `payment.completed` events to your system. This means the Square Webhook URL has not been configured in your Square Developer Dashboard. Without the webhook, completed payments are never recorded in `payment_history` and the pupil balance is never credited.

**2. No `payment_intent` record created for QR payments**
Even if the webhook fires, the `square-webhook` function tries to match payments by looking up `payment_intents.provider_reference = orderId`. But the `square-checkout` function never creates a `payment_intent` record. So the webhook would fail to match the payment to a pupil/instructor and skip it with "could not match to a pupil/instructor".

### What happened with the £1.27 payment
- QR code was generated successfully (Square order `tfzw5I4j6RYGYMOU0QOHiudUl3GZY` for Charlotte D)
- Payment was completed on Square's side
- Square never called back to your system → no `payment_history` record, Charlotte D balance stays at £0.00

### Fix Plan

**Step 1: Update `square-checkout` to create a `payment_intent` record**
After successfully creating the checkout link, insert a record into `payment_intents` with:
- `pupil_id`, `instructor_id` from the request body
- `provider` = `"square_checkout"`
- `provider_reference` = the Square `order_id` returned
- `amount_pence` = the amount in pence
- `status` = `"pending"`
- `order_ref` = the `orderReference` from the request

This gives the webhook something to match against.

**Step 2: Configure Square Webhook URL**
You need to add the webhook URL in your Square Developer Dashboard:
- URL: `https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/square-webhook`
- Events to subscribe: `payment.completed`

**Step 3: Fix redirect URL to use published domain**
The checkout redirect currently points to the preview domain (`ca10d01e-...lovableproject.com`). It should use `https://everydriver.lovable.app` so pupils land on the correct page after payment.

**Step 4: Add fallback matching in `square-webhook`**
Update the webhook to also match by `order_ref` column (not just `provider_reference`) as a safety net, so QR payments can always be reconciled.

### Files to modify
- `supabase/functions/square-checkout/index.ts` — create `payment_intent` record after checkout link creation; fix redirect URL
- `supabase/functions/square-webhook/index.ts` — add fallback `order_ref` matching

### Manual step required from you
Add the webhook URL in Square Developer Dashboard → Webhooks → Add Endpoint:
`https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/square-webhook`

