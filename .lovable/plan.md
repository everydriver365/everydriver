

## Payment Flow Audit & Automated Reminders

### Current State Assessment

After reviewing the codebase, here's how the payment flow currently works and what gaps exist:

**What's Working Well:**
- **Lesson completion** correctly deducts cost from `account_balance` and records a negative `payment_history` entry (both `EndLessonWizard` and `TodayScheduleView`)
- **Manual payments** (cash/card/transfer) correctly add to balance and record in `payment_history` (`StepPayment`)
- **Online payments** (Square, NPI, Elavon, Klarna, Clearpay) update balance and record history via edge functions (`payment-callback`, `square-wallet-payment`)
- **Booking creation** sets initial `account_balance` to `-remainingBalance` for deposit bookings (`create-booking`)
- **Pupil portal** shows balance on dashboard
- **Parent portal** has `ParentPaymentHistory` component and shows `account_balance`
- **Admin portal** has `RevenueAnalytics` showing payment stats
- **Payment reminders** exist via SMS (`send-payment-reminder`) — manual trigger only
- **Deposit reminders** have automated checks at 14/7/1 day intervals (`check-deposit-reminders`)

**Gaps Identified:**

1. **No automated regular payment reminders** — the `send-payment-reminder` is only triggered manually by instructors. There's no scheduled job for non-deposit outstanding balances.
2. **No instructor notification when a payment is received online** — when a pupil pays via card/wallet/BNPL, the instructor isn't notified in real-time.
3. **No push notification for payment reminders** — only SMS is used; web push and email channels are missed.
4. **Pupil portal balance display doesn't show +/- context** — it shows `£X` but not whether it's credit or owed.
5. **No payment receipt visible in parent portal** — `ParentPaymentHistory` exists but may not show all payment channels consistently.
6. **Admin revenue dashboard lacks real-time payment feed** — it shows aggregates but no live transaction log.

### Plan

#### 1. Create automated payment reminder cron job
- New edge function `auto-payment-reminders` that runs daily via cron
- Finds pupils with negative `account_balance` (excluding deposit-type pupils already handled by `check-deposit-reminders`)
- Sends reminders via SMS (Twilio), Email (Resend), and Web Push at configurable intervals (e.g., every 7 days, max 3 reminders)
- Track last reminder sent date in a new `payment_reminder_log` table to avoid spamming
- Schedule via `pg_cron` + `pg_net`

#### 2. Notify instructor when online payment received
- Update `payment-callback`, `square-wallet-payment`, `track-payment-link` edge functions to call `notify-instructor` after successful payment
- Instructor receives push notification: "£X payment received from [Pupil Name]"

#### 3. Fix pupil portal balance display
- Update `PupilPortal.tsx` to show "£X Credit" (green) or "£X Due" (amber/red) instead of just `£X`

#### 4. Add payment activity to admin live feed
- Add a recent transactions table to `RevenueAnalytics` showing last 20 payments across all instructors with pupil name, amount, method, and timestamp

### Database Changes
- New table: `payment_reminder_log` (pupil_id, instructor_id, reminder_type, channel, sent_at) with RLS for instructor/admin read

### Files to Create
- `supabase/functions/auto-payment-reminders/index.ts`

### Files to Modify
- `supabase/functions/payment-callback/index.ts` — add instructor notification
- `supabase/functions/square-wallet-payment/index.ts` — add instructor notification
- `src/pages/PupilPortal.tsx` — fix balance display context
- `src/components/admin/RevenueAnalytics.tsx` — add live transaction feed

