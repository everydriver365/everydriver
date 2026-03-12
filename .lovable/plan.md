

## Analysis: Payment Recording, Balance Credits, and Calendar Sync

### What works correctly now

- **Google Calendar sync**: When a booking is created via `create-booking`, lessons are inserted into `scheduled_lessons`, which fires the `trigger_calendar_sync` database trigger. This adds entries to `calendar_sync_queue`, which is processed by the `process-calendar-queue` edge function to sync lessons to the instructor's connected Google Calendar. This chain is solid.

- **Payment history**: The `payment-callback` edge function correctly records all successful payments into `payment_history` with the right pupil ID, instructor ID, amount, and payment method. This shows up in the instructor portal and pupil payment history.

- **Push notifications and receipt emails**: Both fire correctly on successful payment.

### Issues found

**1. Pupil balance not credited for booking payments**
The `payment-callback` only updates `pupil.account_balance` when `isPupilPayment` is true (i.e., the order reference starts with "PUPIL-" or `type=balance`). Standard booking payments record in `payment_history` but never credit the pupil's account balance. This means the pupil's balance/credit tiles in the portal won't reflect the payment.

**Fix**: In `payment-callback`, after recording a standard (non-balance) booking payment in `payment_history`, also call `increment_pupil_balance` RPC to atomically credit the pupil's balance. This uses the existing atomic RPC rather than the manual read-update pattern (which has race condition risks — the balance payment code also has this issue).

**2. Race condition in balance updates**
The current code reads `account_balance`, adds the amount, then writes back. If two payments complete simultaneously, one could be lost. The `increment_pupil_balance` RPC already exists and handles this atomically — it should be used everywhere.

**Fix**: Replace the manual read-then-write pattern with `supabase.rpc('increment_pupil_balance', { p_pupil_id, p_amount })` for all balance updates in `payment-callback`.

**3. `payment_intents` status never updated**
The `npi-checkout` function creates a `payment_intents` row with status "pending", but `payment-callback` never updates it to "completed" or "failed". This means intent tracking is broken.

**Fix**: At the end of each provider block in `payment-callback`, update the matching `payment_intents` row status based on success/failure.

### Plan

**File: `supabase/functions/payment-callback/index.ts`**

For each provider (NPI/Elavon, Clearpay, Klarna):

1. Replace manual balance update (`read balance → add → write`) with `supabase.rpc('increment_pupil_balance', { p_pupil_id: pupilId, p_amount: paymentAmount })` — atomic, no race conditions
2. For standard booking payments (non-balance), also call `increment_pupil_balance` so the pupil's account reflects the payment
3. After determining success/failure, update `payment_intents` status:
   ```sql
   UPDATE payment_intents SET status = 'completed'/'failed'
   WHERE order_ref = paymentRef OR transaction_unique matches
   ```

No other files need changes. No database migrations needed — `increment_pupil_balance` RPC and `payment_intents` table already exist.

