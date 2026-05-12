## Goal
Make each Needs You tile (Jobs, Msgs, Swaps, Calls, Enquiries) gently pulse when its own count rises, and keep pulsing until the user taps that tile.

## Approach
Add per-tile "new since last seen" tracking in `MobileHomeRedesign.tsx`, and animate the `BentoMini` count + dot when that tile has unseen items.

## Steps

1. **Track last-seen counts per tile** (localStorage, per instructor)
   - Key: `needsYou.lastSeen.{instructorId}` → `{ jobs, msgs, swaps, calls, enquiries }`
   - On mount, read; if a current count > stored last-seen, that tile is "alerting".

2. **Extend `BentoMini`** with an `alerting?: boolean` prop
   - When true, apply a subtle infinite pulse to the number (scale 1 → 1.08 → 1, 1.6s) and a soft halo behind it using the tile's `fg` colour at low opacity.
   - Respect `prefers-reduced-motion` (no transform, just opacity fade).

3. **Clear on tap**
   - Tile `onClick` writes the current count back to last-seen for that key, then navigates as today. Pulse stops immediately.

4. **Live updates**
   - Counts already come from `usePendingJobsCount`, `useUnreadMessagesCount`, `useTestSwapNotifications`, plus the `missedCallsCount`/`enquiriesCount` placeholders. No data wiring changes — pulse simply reacts to count increases.

## Files

- `src/components/instructor/MobileHomeRedesign.tsx`
  - Add `useLastSeenCounts` helper (small inline hook).
  - Compute `alerting` per tile.
  - Pass `alerting` into the 5 `BentoMini` calls and clear on click.
  - Update `BentoMini` to render the pulse animation.

## Notes
- Pulse is scoped to the count digit, not the whole card, so the home screen stays calm.
- No backend or schema changes.