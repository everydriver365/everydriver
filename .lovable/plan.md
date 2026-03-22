

## Plan: Fix Subscription Billing with GoCardless Direct Debit

### Overview
Replace Square-based onboarding payment with GoCardless Direct Debit, add payment tracking, admin alerts for missed payments, auto-downgrade after 7 days, and receipts for all subscription payments.

### Current State
- Onboarding `StepPayment.tsx` uses Square SDK to tokenize cards and calls `square-create-subscription`
- `gocardless-create-billing-request` edge function already exists and creates GoCardless billing requests + mandate flows — but is never called from the onboarding payment step
- `gocardless-webhook` already handles mandate activation, subscription creation, and payment confirmation/failure
- No `subscription_payments` table exists to track individual monthly payments
- No admin alert or auto-downgrade logic exists
- `send-payment-receipt` edge function exists but is only used for pupil payments, not subscription payments

### Changes

#### 1. New database table: `subscription_payments`
Track every monthly payment attempt/result.

```
subscription_payments (
  id uuid PK,
  instructor_id uuid FK,
  subscription_id uuid FK → instructor_subscriptions,
  amount numeric,
  currency text default 'GBP',
  status text (pending/confirmed/failed/refunded),
  gocardless_payment_id text,
  payment_date date,
  period_start date,
  period_end date,
  receipt_sent boolean default false,
  created_at timestamptz,
  updated_at timestamptz
)
```
RLS: instructors can read their own rows.

#### 2. New database table: `admin_alerts`
For payment failure notifications and other admin alerts.

```
admin_alerts (
  id uuid PK,
  alert_type text (payment_failed/payment_overdue/downgrade),
  instructor_id uuid,
  subscription_id uuid,
  message text,
  metadata jsonb,
  is_read boolean default false,
  created_at timestamptz
)
```
RLS: admin-only read via `has_role`.

#### 3. Rewrite onboarding `StepPayment.tsx`
- Remove Square SDK loading and card tokenization
- Instead, call `gocardless-create-billing-request` with the instructor's plan
- Redirect instructor to GoCardless hosted payment page for DD mandate setup
- On return, the webhook flow activates the subscription automatically

#### 4. Update `InstructorPlans.tsx` plan switching
- For upgrades to paid plans: call `gocardless-create-billing-request` and redirect to GoCardless
- For downgrades to free: instant switch (existing logic)
- Remove "contact us" toast for paid plan upgrades

#### 5. Update `gocardless-webhook` — payment events
When `handlePayment` receives `confirmed`:
- INSERT into `subscription_payments` with status `confirmed`
- Call `send-subscription-receipt` to email the instructor
- Extend `current_period_end`

When `handlePayment` receives `failed`:
- INSERT into `subscription_payments` with status `failed`
- INSERT into `admin_alerts` with type `payment_failed`
- Send admin notification email/SMS
- Set `instructor_subscriptions.status` to `payment_failed` (already done)

#### 6. New edge function: `check-subscription-payments`
Cron job running daily. For each instructor with `status = 'payment_failed'`:
- If `current_period_end` was > 7 days ago → downgrade to free plan
  - Update `instructor_subscriptions.plan_id` to free plan ID
  - Update status to `downgraded`
  - INSERT `admin_alerts` with type `downgrade`
  - Notify instructor via SMS/email
- If `current_period_end` was 1-7 days ago → send payment reminder
  - INSERT `admin_alerts` with type `payment_overdue`

#### 7. New edge function: `send-subscription-receipt`
Sends a branded email receipt to the instructor for each confirmed subscription payment, including:
- Amount, date, plan name, period covered
- GoCardless payment reference
- Uses existing Resend integration

#### 8. Admin alerts UI
Add an "Alerts" section to the admin dashboard showing:
- Failed payments, overdue accounts, auto-downgrades
- Mark as read functionality
- Link to instructor profile

### Files Changed

| File | Change |
|------|--------|
| Database | CREATE `subscription_payments` + `admin_alerts` tables with RLS |
| `src/pages/instructor-app/onboarding/steps/StepPayment.tsx` | Replace Square with GoCardless billing request flow |
| `src/pages/InstructorPlans.tsx` | Wire plan upgrades to GoCardless DD |
| `supabase/functions/gocardless-webhook/index.ts` | Record payments, send receipts, create admin alerts |
| `supabase/functions/check-subscription-payments/index.ts` | **New** — daily cron for reminders + auto-downgrade |
| `supabase/functions/send-subscription-receipt/index.ts` | **New** — email receipt for subscription payments |
| `src/components/admin/AdminAlerts.tsx` | **New** — admin alerts panel |
| `src/pages/AdminPortal.tsx` | Add alerts tab |
| Database (cron) | Schedule `check-subscription-payments` daily at 9 AM |

