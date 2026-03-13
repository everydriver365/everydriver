

## Fix: Merge Duplicate Card Payment Sections

### Problem
The mobile booking view has two card payment boxes:
1. **"Recommended" box (lines 843-893)**: Has a deposit/full toggle and a "Pay £X Card" button. But clicking this button doesn't process payment — it only creates the booking record and reveals box #2.
2. **Embedded checkout (lines 930-958)**: The `CardstreamPayButton` that actually processes payment. It appears below after clicking box #1, but has no deposit toggle — it just reads the state from box #1.

This creates a confusing two-step flow where users think the first button should work, and then see a second "card details" section appear below.

### Fix
Merge both into a single flow: when the user clicks "Pay £X Card" in the recommended box, the `CardstreamPayButton` replaces the button **inside the same box** rather than appearing as a separate section below. Remove the standalone embedded checkout section entirely.

### Changes

**`src/components/booking/MobileBookingView.tsx`**:
- Move the `CardstreamPayButton` (embedded checkout) into the "Recommended" box, showing it inline after the user clicks "Pay Card"
- Remove the separate "Enter Card Details" section (lines 930-958) entirely
- When `showEmbeddedCheckout` is true, replace the "Pay £X Card" button with the `CardstreamPayButton` + a cancel link, all within the same recommended box
- Keep the deposit toggle above the payment button/component

This reduces the payment section from two boxes to one, with the deposit toggle always visible above whichever state (button or card form) is shown.

