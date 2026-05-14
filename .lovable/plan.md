# Plan: Wire up "Confirm all lessons" + defer Google Calendar sync until paid

## 1. "Confirm all lessons" button currently does nothing
You're right. `LessonScheduler` exposes an `onConfirm` callback for the button, but neither `src/pages/BookingSummary.tsx` nor `src/pages/everydriver/BookingSummary.tsx` passes it in. Click → no-op.

**Fix:** wire `onConfirm` in both pages to scroll the user down to the `CoursePaymentBlock` (the next required step). Add a `ref` to the payment block wrapper and call `scrollIntoView({ behavior: 'smooth', block: 'start' })`. No business-logic change — this is the natural next step in the flow.

## 2. Don't push lessons to Google Calendar until payment is made

### Current behaviour (the leak)
1. `create-booking` edge function inserts rows into `scheduled_lessons` with `payment_status = 'pending'`.
2. A DB trigger (`trigger_calendar_sync` on insert/update/delete) immediately enqueues a `syncLesson` job in `calendar_sync_queue`.
3. A cron job runs `process-calendar-queue`, which pushes the lesson to Google Calendar **even though no payment has been received yet**.
4. If the pupil abandons the payment, the event already lives in the instructor's Google Calendar (and only gets cleaned up if the pupil/lessons are later cancelled).

### Fix — gate the queue on payment, not the trigger
Trigger stays as-is (so it still fires correctly for instructor-added lessons, reschedules, deletes, etc.). The skip happens in `process-calendar-queue` and the unblock happens at payment success.

**a. New column on `scheduled_lessons`:** `awaiting_initial_payment boolean not null default false` (with a partial index on `awaiting_initial_payment = true` for fast lookups).

**b. `create-booking` edge function:** when inserting the lesson rows from the public booking flow, set `awaiting_initial_payment = true`. Instructor/admin code paths leave it `false` (default), so their lessons sync immediately as before.

**c. `process-calendar-queue` edge function:** after fetching queue rows, join to `scheduled_lessons` and skip any lesson where `awaiting_initial_payment = true`. Leave the queue row unprocessed (so it picks up automatically once the flag flips). Add a small "stale guard": if a row has been pending for > 7 days, mark it processed with `error = 'awaiting payment - timed out'` so the queue doesn't grow forever.

**d. Flip the flag on payment success.** In every payment success path that already runs after a public booking checkout, clear the flag for the booking's lessons and immediately invoke `process-calendar-queue` to flush them:
- `confirm-booking` (Square / Clearpay / Klarna / GoCardless redirect path) — runs after payment; add a step that updates `scheduled_lessons.awaiting_initial_payment = false` for `pupil_id = :pupilId` before it currently calls `process-calendar-queue`.
- GoCardless billing-request webhook (`gocardless-webhook` / equivalent) — same flip on `billing_request.fulfilled`.
- Square + Klarna webhook handlers — same flip on payment captured.
- `clearpay-capture` success — same flip.
- Cash / pay-later paths that intentionally book without immediate payment: explicitly clear the flag in `create-booking` when `paymentType === 'cash'` or when `amountPaid >= totalPrice` at booking time (i.e. nothing further to wait for).

**e. Cancel-on-abandon (optional, recommended):** add a daily cleanup that soft-cancels lessons still flagged `awaiting_initial_payment = true` after 24h with no payment, so they don't clutter the instructor's view. Safer to keep this opt-in — flag it in the plan and only build if you confirm.

### Out of scope (intentionally unchanged)
- Trigger function itself (still queues all changes).
- Instructor-side scheduling, reschedules, manual blocks, GCal pull (`google-calendar-service`).
- Mobile layouts.
- Notification flow (already gated on `confirm-booking`, which only runs after payment).

## Files / surfaces touched
- `src/pages/BookingSummary.tsx`, `src/pages/everydriver/BookingSummary.tsx` — wire `onConfirm` to scroll to payment.
- DB migration — add `awaiting_initial_payment` column + partial index.
- `supabase/functions/create-booking/index.ts` — set the flag on insert.
- `supabase/functions/process-calendar-queue/index.ts` — skip flagged lessons + stale guard.
- `supabase/functions/confirm-booking/index.ts` — clear the flag before flushing the queue.
- Payment webhook/capture functions: `gocardless-webhook` (or current name), `square-*` capture, `klarna-*` capture, `clearpay-capture` — clear the flag on success.

## Open question
Do you want the **24h auto-cancel** of unpaid pending lessons (item 2e)? Default: no, just leave them pending and unsynced.
