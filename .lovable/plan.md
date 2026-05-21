## Goal

On `/instructor/payments` (mobile, `src/pages/InstructorPay.tsx`), make all tiles render at the same size and verify each tile is wired to the correct data and the correct expanded view.

## What's wrong today

**Sizing**
- 2×2 summary grid: each row's two tiles can be different heights because tile content is variable (number of digits, no min-height). On wider numbers the box grows.
- Quick Actions grid: the two accent tiles (Take Payment, Refund) use gradient wrappers and slightly different paddings than the white tiles — they don't line up perfectly.
- The expandable summary tiles use `col-span-2` when expanded, which is intended, but the **collapsed** state still has no fixed min-height so neighbours can mismatch.

**Wiring**
- "Course Rewards" tile shows `instructors.bonus_earned` but expands to `InstructorPayoutHistory` (Square payout history) — wrong drill-down. Should expand to bonus / rewards detail, or be renamed.
- "Credit on Account" sums positive pupil balances correctly, but `PupilBalancesList` in the expanded panel shows all pupils (incl. debtors) — label/content mismatch.
- "Payments This Month" count uses `recordedAt >= start of month` ✓, but the expanded `PaymentHistory` component shows all-time history — drill-down should be filtered to this month to match the headline number.
- "Owes Money" total + expanded debtor list ✓ (correct).

## Changes

### 1. Uniform tile sizing (visual)

- Wrap the 4 summary tiles in the same `tileStyle` with a **fixed `minHeight: 120`** on the collapsed tile body so all four match regardless of digit count.
- Standardise inner padding to `14px`, icon box `44×44 / radius 12`, value `22px/700`, label `12px/400` — already mostly there; remove the per-tile variance.
- Quick Actions: keep accent (Take Payment) and highlight (Refund) gradients, but apply the same `tileStyle` box dimensions and `minHeight: 96` so the 2-col grid lines up cleanly across all 7 actions.
- Keep `col-span-2` expansion behaviour for summary tiles.

### 2. Wiring fixes

| Tile | Headline value (today) | Expanded panel (today) | Fix |
|---|---|---|---|
| Owes Money | sum of negative balances | debtor list with Remind buttons | keep |
| Payments This Month | count of `payment_history` this month | `PaymentHistory` (all-time) | pass a `monthOnly` prop / filter to PaymentHistory so the drill-down matches the headline |
| Course Rewards | `instructors.bonus_earned` | `InstructorPayoutHistory` (Square payouts) | swap drill-down to a bonus-history list (or, if no component exists, link out to `/instructor/bonus` and remove the expand) |
| Credit on Account | sum of positive balances | `PupilBalancesList` (all pupils) | pass `creditOnly` filter so only pupils with positive balances render |

### 3. Files touched

- `src/pages/InstructorPay.tsx` — tile markup, min-heights, drill-down wiring
- `src/components/instructor/PaymentHistory.tsx` — add optional `monthOnly?: boolean` filter
- `src/components/instructor/money/PupilBalancesList.tsx` — add optional `creditOnly?: boolean` filter
- `src/components/instructor/InstructorPayoutHistory.tsx` — only used if we decide to keep it for the bonus tile; otherwise unused on this page

### 4. Out of scope

- No backend / schema changes.
- No copy changes beyond what the wiring requires.
- Desktop payments page (`InstructorPaymentsDesktop.tsx`) — not touched unless you want me to mirror.

## Open question I'll default on

For "Course Rewards" expansion I'll **link out to `/instructor/bonus`** (chevron, no expand) rather than show payout history, since payout history is unrelated to bonuses. Tell me if you'd rather keep an inline expand and I'll build a small bonus-history list instead.
