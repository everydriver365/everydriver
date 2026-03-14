

## Split Card Entry into Two Screens: Amount → Card Fields

### Problem
Currently the card entry view crams pupil selection, amount input, fee breakdown, AND the Cardstream embedded fields all into one scrollable view. On a 390px mobile viewport this is cramped and confusing.

### Solution
Add a new view state `"card-entry"` to the flow:

1. **`"card"` view** — Pupil selector, amount input, fee breakdown, and a "Continue to Payment" button
2. **`"card-entry"` view** — Shows the amount summary and the `CardstreamCheckout` embedded fields only

### Changes

**File: `src/components/instructor/TakePaymentModal.tsx`**

1. Update the `View` type to include `"card-entry"`:
   ```tsx
   type View = "picker" | "qr" | "card" | "card-entry" | "link";
   ```

2. In the existing `"card"` view, replace the inline `<CardstreamCheckout>` with a "Continue to Payment" button that sets `view` to `"card-entry"` (only enabled when pupil + valid amount selected)

3. Add a new `"card-entry"` view block that shows:
   - A compact summary line (pupil name, total charge)
   - The `<CardstreamCheckout>` component (full width, no competing UI)

4. Update `handleBack` to navigate `"card-entry"` → `"card"` → `"picker"`

5. Update header title/description for `"card-entry"` view ("Enter Card Details" / "Complete payment")

### Files to modify
- `src/components/instructor/TakePaymentModal.tsx`

