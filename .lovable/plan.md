## Goal
When a Square (or any) payment lands in `payment_history`, the instructor sees an immediate on-screen confirmation on the Payments screen — without needing to refresh — in addition to the existing push notification.

## Approach
Use Supabase Realtime on `public.payment_history` filtered by the logged-in instructor. On each new row, fire a sonner toast and refresh the on-screen totals.

## Changes

### 1. Enable realtime on the table (migration)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_history;
ALTER TABLE public.payment_history REPLICA IDENTITY FULL;
```
(Safe no-op if already added — wrapped in a DO block to swallow `already member` errors.)

### 2. `src/pages/InstructorPay.tsx` (mobile Payments)
Add a second `useEffect` keyed on `instructorId` that subscribes to:
- `postgres_changes` → `event: 'INSERT'`, `schema: 'public'`, `table: 'payment_history'`, `filter: instructor_id=eq.${instructorId}`

On payload:
- Skip negative amounts (refunds — those already toast from RefundModal)
- Look up pupil name from current `pupils` state (fallback to "a pupil")
- `toast.success(\`£${amount} received from ${name}\`, { description: method === 'Square' ? 'Square payment confirmed' : method })`
- `haptics.success()`
- Re-run `fetchPupils()` (balances) and `fetchRecentPaymentCount()`
- Cleanup: `supabase.removeChannel(channel)` on unmount

### 3. `src/pages/instructor-app/InstructorPaymentsDesktop.tsx` (desktop Payments)
Same subscription + toast + refresh of the local payments/pupils queries (call the existing fetchers used after a manual Take Payment).

### 4. Bonus: status badge in Take Payment QR modal
In `TakePaymentModal.tsx`, while a QR/link is open, subscribe to the same channel filtered by `instructor_id` and amount match. When matched, swap the QR view to a green "Payment received ✓" confirmation card and auto-close after 3s. (Small, isolated change — no layout impact.)

## Out of scope
- No mobile layout changes beyond adding the subscription + toast (per mobile update policy).
- No new tables, no schema changes beyond enabling realtime.
- Refund toasts already exist; not duplicated.

## Files touched
- `supabase/migrations/<new>.sql` — enable realtime
- `src/pages/InstructorPay.tsx`
- `src/pages/instructor-app/InstructorPaymentsDesktop.tsx`
- `src/components/instructor/TakePaymentModal.tsx`
