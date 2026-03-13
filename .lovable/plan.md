

## Booking Flow Audit: Payment Gateways, Records, and Calendar Integration

### Findings Summary

| Area | Status | Details |
|------|--------|---------|
| **Clearpay** | ✅ Working | Redirect → `payment-callback` captures token, records `payment_history`, credits balance via `increment_pupil_balance` RPC, records `platform_commissions`, sends receipt email, notifies instructor |
| **Klarna** | ✅ Working | Redirect → `payment-callback` records payment, credits balance, records commissions, sends receipt, notifies instructor |
| **NPI (Cardstream)** | ✅ Working | HPP POST → `payment-callback` handles response code 0, records payment, credits balance, records commissions |
| **Elavon** | ✅ Working | HPP POST → `payment-callback` (shares NPI handler for `provider=elavon`), same flow |
| **Square Checkout (redirect)** | ⚠️ **NOT RECORDING** | Redirects to Square hosted checkout → returns to `/booking-confirmation?square=success` — **no server-side callback** records the payment. No `payment_history` insert, no balance credit, no commission recorded |
| **Square Wallet (Apple/Google Pay - pupil balance)** | ✅ Working | `square-wallet-payment` function handles payment + records `payment_history` + credits balance |
| **Square Wallet (booking)** | ✅ Working | `square-booking-wallet-payment` creates pupil, lessons, records `payment_history` |
| **WooCommerce** | ✅ Working | Uses sub-flows (NPI/Clearpay/Klarna) for actual payment, plus `woocommerce-update-order` sync |
| **Google Calendar** | ✅ Working | `trigger_calendar_sync` DB trigger → `calendar_sync_queue` → `process-calendar-queue` called immediately by `create-booking` + pg_cron fallback every 5 min |
| **Internal Calendar** | ✅ Working | Reads from `scheduled_lessons` directly; lessons created in `create-booking` |
| **Parent notifications** | ❌ **Not implemented** | No parent notification on booking or payment in any gateway callback |
| **`create-booking` payment_history** | ❌ **Not recorded** | `create-booking` sets negative `account_balance` but never records a `payment_history` entry for the initial booking payment |

---

### Issues Requiring Fixes

#### 1. **Square Checkout (redirect flow) — no payment recording** (Critical)
The `square-checkout` function creates a Square Checkout link and redirects the user. When Square redirects back to `/booking-confirmation?square=success`, nothing server-side records the payment. The `payment-callback` edge function has no `provider === "square"` handler.

**Fix**: Add Square as a provider in `payment-callback`, OR use the Square webhook (`payment.completed` event) in `square-webhook/index.ts` to record the booking payment. The cleanest approach is to add a Square webhook handler for `payment.completed` that looks up the pupil by `reference_id`, records `payment_history`, and credits the balance.

#### 2. **`create-booking` doesn't record payment_history** (Medium)
When `create-booking` is called, it sets `account_balance: -remainingBalance` but doesn't insert a `payment_history` row. For redirect-based gateways (NPI, Clearpay, Elavon, Klarna), the `payment-callback` eventually records it. But this means:
- Free bookings (£0) have no payment record at all
- The initial booking amount is only implied by the negative balance

**Fix**: For redirect gateways, this is acceptable (callback records it). For free bookings, add a `payment_history` entry with amount 0 and method "free".

#### 3. **Square Booking Wallet — no calendar queue flush** (Low)
`square-booking-wallet-payment` creates lessons and relies on the DB trigger alone (line 264: "Calendar sync will be handled by database trigger"). Unlike `create-booking`, it does NOT call `process-calendar-queue` immediately. The pg_cron fallback will catch it within 5 minutes, but there's a delay.

**Fix**: Add the same `process-calendar-queue` fetch call that `create-booking` uses.

#### 4. **Parent notifications on payment/booking** (Not implemented)
No payment callback or booking function sends any notification to a pupil's parent. The `parent-weekly-summary` function exists but is separate.

**Fix**: If parents should be notified of bookings/payments, add a call to a parent notification function in `create-booking` and `payment-callback`. This requires checking if the pupil has a linked parent record.

---

### Proposed Changes

| File | Change |
|------|--------|
| `supabase/functions/square-webhook/index.ts` | Add `payment.completed` handler: look up pupil by `reference_id` prefix (`SQ-` or `BOOK-`), record `payment_history`, credit balance via `increment_pupil_balance`, record `platform_commissions`, notify instructor |
| `supabase/functions/square-booking-wallet-payment/index.ts` | Add `process-calendar-queue` fetch call after lesson creation (same pattern as `create-booking`) |
| `supabase/functions/create-booking/index.ts` | Add `payment_history` insert for free bookings (amount=0, method="free") |

Parent notifications can be added as a follow-up if desired — it's a separate feature scope.

