

## Fix Payment & Booking Flow Bugs

### Assessment Summary

| Bug | Status | Action |
|-----|--------|--------|
| A1 | WooCommerce code exists (lines 149-158, 753-1018, 2090-2169) | Remove all WooCommerce state, handlers, and JSX |
| B1 | Duplicate redirect in Klarna handler | Resolved by A1 removal |
| B2 | Setters before null guard (lines 277-292) | Fix: move guard before setters |
| B3 | `findNextAvailableDate` in dep array but unused | Fix: remove from dependency array, remove unused fetches |
| B4 | Stale closure in race guard | Fix: add `bookingPupilIdRef` |
| B5 | Missing `showHostedFields` dependency | Fix: add to dep array |
| B6 | GoCardless cancelled cleanup | Fix: add cleanup useEffect |
| C1 | `instructor_id` not in select | Fix: add to select string |
| D1 | `square-booking-wallet-payment` stub | **Already fully implemented** (340 lines) - needs idempotency + env fix only |
| D2 | `square-wallet-payment` race condition | **Already fixed** in prior session - uses `increment_pupil_balance` RPC |
| D3 | `square-wallet-payment` diverging timestamps | **Already fixed** - uses shared `ts` variable |
| D4 | `square-payment` DB errors swallowed | **Already fixed** - has try/catch with `dbError` response |
| D5 | `square-checkout` cancelUrl + env check | **Already fixed** - has `cancel_url` and normalized env check |
| E1 | GoCardless webhook 30-day hardcode | Valid - line 239 and 313 |
| F1 | SquarePaymentForm null checks | **Already present** (lines 86-88) |
| F2 | `customerPhone` unused | Valid - not passed in `processPayment` body... wait, it IS passed (line 219). **Already fixed.** |
| G1 | `clearForManual` unused | **Actually used** - bound to checkbox, used in logic (line 91, 103, 373) |
| G2 | Return type annotation | **Already present** |
| G3 | Unused `Clock` import | **Already fixed** (line 2 shows no Clock) |
| G4 | Separator in dependency array | Valid |
| G5 | Guard in `handleConfirm` | Valid |
| G6 | Desktop "load more" | Valid |

### Changes to Make

**`src/pages/BookingSummary.tsx`** (A1, B2, B3, B4, B5, B6):
- Remove WooCommerce state: `wooOrder`, `showWooPaymentOptions`, `isWooLoading` (lines 149-158)
- Remove handlers: `handleWooCommerceCheckout` (753-810), `markWooOrderPaid` (812-836), `handleWooNPIPayment` (838-881), `handleWooClearpayPayment` (883-943), `handleWooKlarnaPayment` (946-1012), `handleCancelWooPayment` (1014-1018)
- Remove JSX block at lines 2090-2169 (WooCommerce payment options panel)
- Move error guard (lines 288-292) before setter calls (lines 277-286)
- Remove `findNextAvailableDate` from useEffect dependency array (line 333), remove `workingHoursRes` and `dateOverridesRes` from Promise.all
- Add `bookingPupilIdRef` ref that mirrors state, read from ref in race guard (lines 368-369)
- Add `showHostedFields` to dependency array (line 355)
- Add GoCardless cancelled cleanup useEffect

**`src/pages/BookingConfirmation.tsx`** (C1):
- Add `instructor_id` to the select string (line 168)

**`supabase/functions/square-booking-wallet-payment/index.ts`** (D1 partial):
- Fix diverging idempotency key (lines 86-87): use shared `ts` variable
- Fix environment check (lines 90-92): normalize to lowercase with aliases

**`supabase/functions/gocardless-webhook/index.ts`** (E1):
- Add `billing_interval_months` column to `subscription_plans` via migration
- Replace hardcoded 30 days (lines 239, 313) with plan-based interval calculation

**`src/components/booking/AutoSchedulePreview.tsx`** (G4, G5):
- Change `.join(',')` to `.join('|')` in dependency array (line 90)
- Add guard `if (!isComplete || confirmed) return;` in `handleConfirm` (line 92)

**`src/pages/Courses.tsx`** (G6):
- After desktop grid (line 1251), add "Showing 6 of N" message when > 6 results

### Database Migration
```sql
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS billing_interval_months integer NOT NULL DEFAULT 1;

UPDATE subscription_plans SET billing_interval_months = 12 
WHERE name ILIKE '%annual%' OR name ILIKE '%yearly%';
```

### Skipped (already fixed or actively used)
- D2, D3, D4, D5: Already fixed in prior sessions
- F1, F2: Already implemented correctly
- G1: `clearForManual` is actively used in UI and logic
- G2, G3: Already correct

### Files Modified
- `src/pages/BookingSummary.tsx`
- `src/pages/BookingConfirmation.tsx`
- `supabase/functions/square-booking-wallet-payment/index.ts`
- `supabase/functions/gocardless-webhook/index.ts`
- `src/components/booking/AutoSchedulePreview.tsx`
- `src/pages/Courses.tsx`

