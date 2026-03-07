

## Booking and Payment Flow — Bug Report

I've audited the booking and payment flows end-to-end and found **5 bugs**, ranging from a crash-level error to silent data issues.

---

### Bug 1: `create-booking` crashes on every successful booking (Critical)

**File:** `supabase/functions/create-booking/index.ts`, lines 243-248

The code references an undefined variable `syncResponse`:

```
// Calendar sync happens automatically via trigger_calendar_sync trigger
console.log("Calendar sync will be handled by database trigger");

const syncResult = await syncResponse.json();  // ← syncResponse is NEVER defined
```

This throws a `ReferenceError` on every booking. It's caught by the surrounding try/catch so the booking still completes, but it means the calendar sync log line and any downstream logic in that block silently fails. The fix is to remove lines 247-248 since the trigger handles sync.

---

### Bug 2: Square checkout doesn't include upsell total (Medium)

**File:** `src/pages/BookingSummary.tsx`, line 593

Square sends `amount: totalPrice` but Clearpay, Klarna, and NPI all send `amount: totalPrice + upsellTotal`. If a pupil adds upsells and pays via Square, they're undercharged.

**Fix:** Change to `amount: totalPrice + upsellTotal`.

---

### Bug 3: Elavon checkout doesn't include upsell total (Medium)

**File:** `src/pages/BookingSummary.tsx`, line 644

Same issue as Square: `amount: totalPrice` should be `amount: totalPrice + upsellTotal`.

---

### Bug 4: Non-slot booking modes fail validation (Medium)

**File:** `supabase/functions/create-booking/index.ts`, line 27

The schema requires `slots: z.array(bookingSlotSchema).min(1)`. But for `auto_assign` and `instructor_assigns` booking modes, the frontend doesn't require slot selection (`requiresSlotSelection = false`), so `selectedSlots` may be empty. This will cause the edge function to reject the booking with a validation error.

**Fix:** Change `.min(1, ...)` to `.min(0)` or make slots optional, and handle the no-slots case in the lesson creation logic.

---

### Bug 5: Race condition in manual payment recording (Low)

**File:** `src/components/instructor/end-lesson/StepPayment.tsx`, lines 63-72

The code fetches the current balance, adds the payment amount client-side, then writes it back. If two payments are recorded simultaneously (e.g. one online, one manual), one update will be lost. This should use an atomic increment (e.g. a database function or RPC call) rather than read-modify-write.

---

### Recommended Fix Order

1. **Bug 1** — Remove dead `syncResponse` reference (1-line fix, stops silent errors)
2. **Bug 4** — Fix slot validation for non-pupil-choice modes (booking is broken for those modes)
3. **Bugs 2 & 3** — Add `upsellTotal` to Square and Elavon amounts
4. **Bug 5** — Refactor balance update to atomic increment

All fixes are contained to 3 files: `create-booking/index.ts`, `BookingSummary.tsx`, and `StepPayment.tsx`.

