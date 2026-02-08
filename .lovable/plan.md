

## Tie All Payment Channels to Correct Pupil and Refresh All Balance Tiles

### Problem

Payments arrive through 5 different channels but they don't all correctly record against the pupil, and the UI tiles showing balance/payment status don't refresh consistently after payments.

**Current gaps:**

| Channel | Records payment_history? | Updates account_balance? | UI tiles refresh? |
|---------|------------------------|------------------------|-------------------|
| Online booking (NPI/Elavon/Clearpay) | Yes | Yes (for pupil payments) | Partial -- only on page redirect |
| Online booking (Klarna) | Yes but amount is 0 | No | No |
| In-car QR code | Yes (via same checkout flow) | Yes | Partial -- redirect only |
| Cash (RecordPaymentModal) | Yes | Yes | Only the local card that triggered it |
| Email payment link (track-payment-link) | No | No | No |

---

### Solution

Two changes: (1) fix the backend gaps so all channels correctly record payments, and (2) add a centralised React Query invalidation system so all balance tiles update after any payment.

---

### Backend Fixes

**1. Fix Klarna payment callback (amount is recorded as 0)**

In `payment-callback/index.ts`, the Klarna handler currently records `amount: 0` because it doesn't extract the amount. Fix: pass the amount via query param from the checkout redirect, and also update `account_balance` for pupil balance payments (currently skipped for Klarna).

**2. Fix email payment link (track-payment-link) -- no payment_history or balance update**

In `track-payment-link/index.ts`, when `action === "paid"`, the function only updates `payment_link_tracking.status` to "paid". It needs to also:
- Look up the pupil from the link data (`payment_link_tracking` has `pupil_id` and `instructor_id`)
- Insert a `payment_history` record
- Update the pupil's `account_balance`
- Send a payment receipt email

---

### Frontend: Centralised Payment Cache Invalidation

**3. Create a shared `usePaymentInvalidation` hook**

A small hook that returns a function to invalidate all payment-related React Query keys at once:

```
Query keys to invalidate:
- ["pupil-payment-status", pupilId]
- ["pupil-balances", instructorId]
- ["instructor-pupils-payment-summary", instructorId]
- ["next-lesson-details", ...]
- ["today-schedule", ...]
```

**4. Wire invalidation into RecordPaymentModal**

After the cash/manual payment is saved, call the invalidation function so all tiles update immediately -- not just the card that opened the modal.

**5. Wire invalidation into BrandedPupilPortal payment return**

When `?payment=success` is detected, invalidate all payment-related queries so the pupil portal balance card, payment history, and any other widgets refresh.

**6. Wire invalidation into BookingConfirmation**

When a booking payment is confirmed, invalidate payment queries so the instructor's dashboard tiles reflect the new payment.

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/payment-callback/index.ts` | Fix Klarna handler: extract amount from query param, update pupil balance, send receipt email |
| `supabase/functions/track-payment-link/index.ts` | When action=paid: insert payment_history, update pupil account_balance, trigger receipt email |
| `src/hooks/usePaymentInvalidation.ts` (NEW) | Shared hook that invalidates all payment-related React Query keys |
| `src/components/instructor/RecordPaymentModal.tsx` | Use usePaymentInvalidation after recording cash payment |
| `src/pages/BrandedPupilPortal.tsx` | Use usePaymentInvalidation on payment=success return |
| `src/pages/BookingConfirmation.tsx` | Use usePaymentInvalidation when payment is confirmed |

### No database migration needed -- all tables already exist.

---

### Implementation Steps

| Step | Action |
|------|--------|
| 1 | Fix Klarna amount recording and balance update in `payment-callback/index.ts` |
| 2 | Add payment_history + balance update to `track-payment-link/index.ts` |
| 3 | Create `usePaymentInvalidation` hook |
| 4 | Wire invalidation into RecordPaymentModal, BrandedPupilPortal, and BookingConfirmation |
| 5 | Deploy updated edge functions and test |

