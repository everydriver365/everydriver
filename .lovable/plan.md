

## Fix "Take Payment" Dead Link & Card Entry

### Problem 1: Dead Link
The route `/instructor/take-payment` does not exist in `App.tsx`. Multiple components navigate to it:
- `QuickActionsPopoverMenu.tsx` (green plus menu) — line 23
- `QuickActionTiles.tsx` — line 327
- `SwipeableQuickAccess.tsx` — line 54
- `DesktopQuickActionBar.tsx` — line 13
- `NextUpTile.tsx` — line 462

**Fix:** Create a dedicated page at `/instructor/take-payment` that renders the `TakePaymentModal` auto-opened. This page will fetch instructor data and pupils, display the modal, and navigate back on close.

### Problem 2: Card Entry in Modal
The `TakePaymentModal` already has card entry UI. The `CardstreamCheckout` component exists and is wired up. The card entry flow should work once the modal is accessible. If there's an issue with `merchantId` not being returned, that's a `payment-intent-create` edge function issue — but the UI path is already correct.

### Files to Change

**1. New: `src/pages/InstructorTakePayment.tsx`**
- Page component that wraps `TakePaymentModal` with `open={true}`
- Uses `useInstructorAuth()` to get instructor data
- Fetches pupils list on mount
- On modal close, navigates back (`navigate(-1)`)
- Add lazy import + route in `App.tsx`

**2. `src/App.tsx`**
- Add lazy import for `InstructorTakePayment`
- Add route: `<Route path="/instructor/take-payment" element={<InstructorTakePayment />} />`

This approach keeps all existing navigation links working without modifying every component that references the route.

