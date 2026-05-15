## Problem

When a pupil starts the booking checkout, picks a payment method (Square / Clearpay / GoCardless / NPI), and then cancels at the gateway, they're sent back to `/book/:instructorId?...=cancelled`. That route IS the BookingSummary page, but it loads fresh — pupil details, selected lesson slots, upsells, and deposit/full choice are all gone, so they have to start from scratch just to try a different method.

Klarna and the embedded Square hosted-fields don't have this issue (they're in-page modals), so this is specifically about flows that redirect to an external URL.

## Fix

**Save a checkout draft to `localStorage` right before any external redirect, then rehydrate on mount.**

1. **Add a `useCheckoutDraft` helper** keyed by `instructorId + hours` (so different courses don't collide):
   - `saveDraft(state)` — writes pupil details, pickup fields, special-needs, selected slots (as ISO strings), selected upsells, payment option (full/deposit).
   - `loadDraft()` — reads and returns it if present and not stale (e.g. < 2 hours old).
   - `clearDraft()` — wipes it.

2. **Save before each external redirect** in `BookingSummary.tsx`:
   - `handleClearpayCheckout` (line ~633)
   - `handleSquareCheckout` (line ~847)
   - `handleInstantBankPay` (line ~735) — already persists `gc_pending_booking`; extend it to also save the form draft so the user gets their form back on cancel.
   - `handleNPICheckout` / `handleShowHostedFields` (in-page, but also save in case they reload).

3. **Rehydrate on mount.** In the existing cancel-cleanup `useEffect` (line ~213), broaden the condition: if any of `gocardless`, `square`, `clearpay`, `npi` query param equals `cancelled`, load the draft and restore:
   - `pupilName`, `pupilEmail`, `pupilPhone`, `pupilAddress`, `pupilPostcode`
   - `differentPickup`, `pickupAddress`, `pickupPostcode`, `pickupWhat3words`
   - `hasSpecialNeeds`, `specialNeeds`
   - `selectedSlots` (parse ISO strings back to Date)
   - `selectedUpsells`
   - `paymentOption`
   Then strip the `*=cancelled` param from the URL via `setSearchParams` and show a toast: "Payment cancelled — your booking details are saved, choose another method."

4. **Clear the draft on success.** On every successful navigate to `/booking-confirmation`, also call `clearDraft()`. (Done inside the success handlers — Klarna, cash, NPI success, Square/Clearpay/GoCardless success returns rehydrate then clear; for the redirect-back flows the booking-confirmation page already exists, so we clear the draft when BookingSummary unmounts on success or simply when `?...=success` hits the booking-confirmation page — easier to just clear at the start of `handleConfirm`/each success path inside BookingSummary).

5. **Apply the same change to the everydriver variant** `src/pages/everydriver/BookingSummary.tsx`. Use the same helper, just a different storage key prefix (`ed-checkout-draft:`) so the two flows don't collide.

## Out of scope
- No backend / RPC changes.
- No change to which payment methods are offered or how they're labelled.
- No change to the cancel URL structure (already points to the right page).
- Mobile layout untouched.

## Files changed
- New: `src/hooks/useCheckoutDraft.ts`
- `src/pages/BookingSummary.tsx`
- `src/pages/everydriver/BookingSummary.tsx`