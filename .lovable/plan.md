# Restore Square card payments

Re-enable the card path in `supabase/functions/record-payment/index.ts` that was removed in Fix 1 (Bug 3).

## Change

Replace the current 400-error stub:

```ts
if (body.method === "card") {
  return json({ error: "Card payments are not currently available..." }, 400);
}
```

with the original Square checkout invocation: call the `square-checkout` edge function with `pupilId`, `instructorId`, `amount`, `customerEmail`, `customerName`, `customerPhone`, `returnUrl`, `cancelUrl`, and return its `{ checkoutUrl, paymentId }` response to the client. Cash/bank atomic insert path below it is untouched.

## Not changing

- Cash/bank insert (already snake_case, working)
- Receipt/push/pupil-notify fan-out
- `square-checkout`, `square-webhook`, `square-oauth` functions
- Any frontend code

After the edit I'll redeploy `record-payment` and confirm the file compiles.