## Symptom
Bottom-bar button reads `Pay £X` (so pupil details ✅ and slots ✅) but stays greyed out and unclickable.

## Root cause analysis
`canSubmit` in `src/pages/BookingSummary.tsx:570` is:

```
isPupilDetailsComplete && (requiresSlotSelection ? isFullyScheduled : true)
  && !isSubmitting
  && unavailableSlots.length === 0
```

If the label is already `Pay £X`, the first two conditions are satisfied, so the disable is coming from one of:

1. **`unavailableSlots.length > 0`** — populated by the availability re-check before payment. `handleSlotsChange` clears it, but if the user doesn't touch the scheduler again after a clash was detected the array stays populated and silently keeps the button dead. Most likely culprit.
2. **`isSubmitting` stuck `true`** — if a payment attempt throws before `setIsSubmitting(false)` runs in the `finally`, the button locks until reload.
3. **`unavailableSlots` getting set on mount** by a stale availability check while `selectedSlots` is still empty.

## Fix
1. **Auto-clear `unavailableSlots` when affected slots are removed/changed**, not only on the next `handleSlotsChange`. Recompute on every `selectedSlots` change and drop entries whose `date+startTime` are no longer selected.
2. **Surface the reason on the disabled button**: when `canSubmit` is false but the label is `Pay £X`, show a small helper line under the button ("X slots need re-picking" or "Finishing previous attempt…") so users aren't stuck guessing. Also scroll the unavailable-slots banner into view on tap.
3. **Guarantee `isSubmitting` resets**: audit each payment handler (Ryft / Klarna / Clearpay / GoCardless / Cash) and ensure every path has a `finally { setIsSubmitting(false) }`. Add a 60s safety timeout that releases the lock if no redirect/response happened.
4. **Console-log the blocking reason** in dev so future debugging is one glance.

## Files touched
- `src/pages/BookingSummary.tsx` — `unavailableSlots` cleanup effect, payment handler `finally` audit, safety timeout, debug log.
- `src/components/booking/BookingBottomBar.tsx` — optional helper sub-text under the button when disabled-but-labelled-Pay.
- `src/components/booking/MobileBookingView.tsx` — pass a `disabledReason` string through.

No backend / RLS / schema changes.

## Verification
- Repro: open a course, fill details, pick slots, then have an admin grab one of those times — Pay button should now show "1 slot no longer available — re-pick" and the banner should auto-focus.
- Repro: trigger a failed Ryft attempt (cancel on hosted page) → button must re-enable on return.
