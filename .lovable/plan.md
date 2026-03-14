

## Make Card Entry Screen Fit Mobile Viewport Without Scrolling

### Problem
On a 390×560 viewport, the card-entry view scrolls because:
1. The `CardstreamCheckout` wraps everything in a `<Card>` with `p-6` padding
2. The "Pay £X.XX" header and "Secure payment" subtitle add unnecessary height
3. The parent container has `max-h-[70vh] overflow-y-auto` which clips content
4. Combined padding from dialog + card + spacing is excessive

### Changes

**File: `src/components/payments/CardstreamCheckout.tsx`**
- Remove the outer `<Card>` / `<CardContent>` wrapper — the component is already inside the modal
- Remove the "Pay £X.XX" header and "Secure payment" subtitle (the parent modal already shows the amount summary)
- Reduce spacing: `space-y-4` → `space-y-3`, remove extra `pt-2` on the security notice
- Reduce loading/error padding from `py-8` to `py-4`

**File: `src/components/instructor/TakePaymentModal.tsx`**
- For the `card-entry` view, remove `max-h-[70vh] overflow-y-auto` constraint (use a conditional or move the constraint to only non-card-entry views)
- Reduce padding on the card-entry content area

### Result
The card fields, pay button, and security notice all fit within a single screen on mobile with no scrolling.

