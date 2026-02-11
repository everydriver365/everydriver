

# Instructor Payout Management System

## Overview

Create a full payout tracking system where admin can see all pupil payments received by instructors, mark them as "transferred" (paid out), and instructors can see which payments have been paid to them by admin. Also allow the system to show who the payment was received from so it updates the pupil balance sitewide

## Database Changes

### New table: `instructor_payouts`

Tracks admin payouts to instructors. Each row links to one or more `payment_history` records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto-generated |
| `instructor_id` | uuid (FK -> instructors) | Who is being paid |
| `amount` | numeric | Total payout amount |
| `payment_ids` | uuid[] | Array of `payment_history.id` values included |
| `notes` | text | Optional admin notes |
| `transferred_at` | timestamptz | When admin marked as paid |
| `created_at` | timestamptz | Default now() |

### New column on `payment_history`

| Column | Type | Notes |
|--------|------|-------|
| `payout_status` | text | Default `'pending'` -- values: `pending`, `transferred` |
| `payout_id` | uuid | FK to `instructor_payouts.id`, nullable |
| `transferred_at` | timestamptz | When admin marked this payment as transferred |

## Admin Portal Changes

### 1. New section: "Instructor Payouts" (key: `instructor-payouts`)

Add a new tile in the "Finance & Payments" category of `AdminSettingsGrid.tsx` and a new section in `AdminPortal.tsx`.

### 2. New component: `AdminInstructorPayouts.tsx`

Two-tab layout:

**"Pending" tab (default):**
- Table grouped by instructor showing all `payment_history` records where `payout_status = 'pending'`
- Summary row per instructor with total owed
- Checkbox selection to pick payments
- "Mark as Transferred" button opens a confirmation dialog, sets `payout_status = 'transferred'`, `transferred_at = now()`, and creates an `instructor_payouts` record
- Realtime subscription for new payments (shows notification badge)

**"Paid" tab:**
- Table of completed payouts from `instructor_payouts`
- Shows instructor name, amount, date transferred, and which payments were included
- Expandable row to see individual payment details

### 3. Badge count on the tile

Show count of pending (untransferred) payments as a notification badge on the "Instructor Payouts" tile.

## Instructor Portal Changes

### 4. New component: `PayoutStatusBadge.tsx`

Small badge shown on payment history items indicating "Pending" (amber) or "Transferred" (green).

### 5. Update `PaymentHistory.tsx` and `PupilPaymentHistory.tsx`

Add the payout status badge next to each payment record so instructors can see which payments have been paid out to them by admin.

### 6. New section on Instructor Pay page (`InstructorPay.tsx`)

Add a "Payouts from Admin" card showing:
- Recent payouts received (from `instructor_payouts` table)
- Total transferred this month
- Pending amount awaiting transfer

### 7. Mobile app: `InstructorSettings.tsx`

Add a "Payouts" tile in the settings/finance area linking to payout history.

## Technical Details

### Migration SQL

```sql
-- Add payout tracking columns to payment_history
ALTER TABLE public.payment_history 
  ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_id uuid,
  ADD COLUMN IF NOT EXISTS transferred_at timestamptz;

-- Create instructor payouts table
CREATE TABLE IF NOT EXISTS public.instructor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id),
  amount numeric NOT NULL,
  payment_ids uuid[] NOT NULL DEFAULT '{}',
  notes text,
  transferred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_payouts ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (using has_role)
CREATE POLICY "Admins can manage payouts"
  ON public.instructor_payouts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Instructors can view their own payouts
CREATE POLICY "Instructors can view own payouts"
  ON public.instructor_payouts FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_payouts;

-- Index for performance
CREATE INDEX idx_payment_history_payout_status ON public.payment_history(payout_status);
CREATE INDEX idx_instructor_payouts_instructor ON public.instructor_payouts(instructor_id);
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/AdminInstructorPayouts.tsx` | Main admin payout dashboard with Pending/Paid tabs |
| `src/components/instructor/PayoutStatusBadge.tsx` | Reusable badge showing pending/transferred status |
| `src/components/instructor/InstructorPayoutHistory.tsx` | Card for instructor portal showing their payout history |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminPortal.tsx` | Add `instructor-payouts` section + sectionMeta entry |
| `src/components/admin/AdminSettingsGrid.tsx` | Add "Instructor Payouts" tile to Finance & Payments category with badge count |
| `src/pages/InstructorPay.tsx` | Add InstructorPayoutHistory card |
| `src/components/instructor/PaymentHistory.tsx` | Show payout status badge on each row |
| `src/components/instructor/PupilPaymentHistory.tsx` | Show payout status badge on each row |

### Flow

```text
1. Pupil pays instructor (payment_history record created, payout_status = 'pending')
2. Admin sees pending payment in "Instructor Payouts" section
3. Admin selects payments and clicks "Mark as Transferred"
4. System creates instructor_payouts record and updates payment_history rows
5. Instructor sees "Transferred" badge on their payment history
6. Instructor sees payout summary on their Pay page
```

