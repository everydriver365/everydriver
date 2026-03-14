

## Fix: Make Outstanding Balances Alert Interactive

### Problem
The "Outstanding Balances" strip at the bottom of the Daily Manifest renders each debtor as a plain `<span>` — tapping does nothing.

### Changes — `src/components/instructor/dashboard/DailyManifest.tsx`

1. **Store pupil `id`** in the `overdueBalances` state (update the interface and query to include `id`).
2. **Make each debtor name tappable** — wrap in a `<Link>` to `/instructor/pupils?pupil={id}` so tapping navigates to that pupil's profile.
3. **Make the "Outstanding Balances" header tappable** — link the whole strip header to `/instructor/payments` as a "View All" action.
4. **Add visual affordance** — underline-on-hover, chevron icon, so it looks interactive.

No database or backend changes needed.

