I’ll update the Payments tab so every tile is visually consistent and each value/expanded section uses the correct live data source.

## What I’ll change

1. **Unify summary tile sizing**
   - Apply one shared tile layout to the 4 summary tiles: Owes Money, Payments This Month, Course Rewards, Credit on Account.
   - Keep equal height in the normal 2-column grid.
   - When a tile expands, only the expanded panel changes height; the tile header remains the same size.

2. **Unify Quick Actions sizing**
   - Make every Quick Action tile the same height and structure.
   - Ensure link tiles and button tiles both fill their grid cells correctly.

3. **Fix live data wiring**
   - **Owes Money:** continue using live pupil balances, filtered to negative balances only.
   - **Payments This Month:** use live `payment_history` records from the current month only, both for the count tile and expanded history.
   - **Course Rewards:** use live instructor `bonus_earned` and link to the Bonus page, rather than opening unrelated payout history.
   - **Credit on Account:** use live pupil balances, filtered to positive balances only in the expanded list.

4. **Refresh after actions**
   - After taking a payment or processing a refund, refresh pupils, payment count, and payment stats so the tiles update without stale values.

## Files to update

- `src/pages/InstructorPay.tsx`
- `src/components/instructor/PaymentHistory.tsx`
- `src/components/instructor/money/PupilBalancesList.tsx`

## Technical notes

- No database changes needed.
- No mock or hard-coded values will be added.
- Existing payment/balance queries and RPC flow will remain intact.