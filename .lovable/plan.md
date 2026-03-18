

# Plan: Defer Booking Notifications Until After Payment

## Problem
When a user selects Clearpay, Klarna, or Square redirect checkout, the system calls `ensureBookingCreated()` BEFORE payment is taken. This immediately:
- Creates the pupil record and scheduled lessons
- Sends SMS to the instructor
- Sends welcome email to the pupil  
- Syncs lessons to Google Calendar
- Notifies parents

If the user cancels payment or it fails, the booking and all notifications have already been sent.

**Embedded card form and wallet payments are already correct** — they create the booking only after payment succeeds.

## Solution

### 1. Split `create-booking` into silent record creation
**File:** `supabase/functions/create-booking/index.ts`

Remove all notification steps (steps 5-10): instructor SMS, calendar sync, pupil welcome email, parent notification, upsell notifications. Keep only:
- Create pupil record
- Create scheduled lessons
- Save upsells
- Update next lesson date
- Record payment_history for free bookings (£0 only)

Add a `skipNotifications` flag (default `true`) so the function creates records silently. If `skipNotifications` is explicitly `false` (for free bookings where no payment is needed), send notifications immediately.

### 2. Create new `confirm-booking` edge function
**File:** `supabase/functions/confirm-booking/index.ts`

Accepts `pupilId` and `instructorId`. Performs all the notification work that was removed from `create-booking`:
- Notify instructor (SMS with all lessons)
- Send pupil welcome email
- Flush calendar sync queue
- Notify parent
- Send upsell purchase notifications

### 3. Call `confirm-booking` after payment succeeds
**File:** `src/pages/BookingSummary.tsx`

- **Embedded card `onPaid`** (lines 1942, 1079): After `ensureBookingCreated()` succeeds, also call `supabase.functions.invoke("confirm-booking", { body: { pupilId, instructorId } })`
- **Clearpay/Klarna/Square redirect**: The booking confirmation page should trigger `confirm-booking` when it detects a successful return (via URL params like `clearpay=success`, `klarna=success`, `square=success`)
- **Free bookings** (£0): Call `confirm-booking` immediately after `ensureBookingCreated()`
- **Wallet payments**: `square-booking-wallet-payment` already handles its own notifications — no change needed

### 4. Update BookingConfirmation page
**File:** `src/pages/BookingConfirmation.tsx` (or wherever it lives)

On mount, if URL params indicate successful payment (`clearpay=success`, `klarna=success`, `square=success`), call `confirm-booking` with the `pupilId` from the URL. Use a flag to prevent duplicate calls.

### 5. Update `supabase/config.toml`
Add `confirm-booking` function with `verify_jwt = false` so it can be called from the client.

## Files Modified
- `supabase/functions/create-booking/index.ts` — remove notification steps
- `supabase/functions/confirm-booking/index.ts` — **new** function for post-payment notifications
- `src/pages/BookingSummary.tsx` — call `confirm-booking` after embedded card/wallet payment success
- `src/pages/BookingConfirmation.tsx` — call `confirm-booking` on redirect return
- `supabase/config.toml` — register new function

