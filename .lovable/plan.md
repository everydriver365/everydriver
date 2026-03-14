

## Remove Card Entry from Instructor Take Payment Modal

### What changes
Remove the "Card Entry" option from the instructor's Take Payment modal. Instructors will only see **QR Code** and **Send Link**. Pupil/parent apps keep their existing Apple Pay, Google Pay, and card payment options unchanged.

### Technical changes

**`src/components/instructor/TakePaymentModal.tsx`**
1. Remove `"card"` and `"card-entry"` from the `View` type → `type View = "picker" | "qr" | "link"`
2. Remove the `CardstreamCheckout` import (line 3)
3. Remove the `CreditCard` icon import
4. Remove the `useAdminFee` hook import and usage (lines 16, 60-61) — only used for card entry fee calculation
5. Remove the card option from the `options` array (lines 163-168)
6. Remove the `handleBack` logic for `card-entry` (lines 79-84) — simplify to always go to `"picker"`
7. Remove the entire `view === "card"` block (lines 281-338) — pupil selector + amount + fee breakdown
8. Remove the entire `view === "card-entry"` block (lines 340-359) — CardstreamCheckout rendering
9. Remove dialog title/description entries for `"card"` and `"card-entry"` views
10. Clean up the conditional class on the content div (line 210) — no longer needs the card-entry exception

This is a removal-only change. No new code needed. Pupil-facing components (`ElavonWalletButtons`, `CardstreamCheckout` in pupil flows, `ElavonBookingWalletButtons`) are untouched.

