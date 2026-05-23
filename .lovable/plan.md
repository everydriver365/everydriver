## Goal
Show traffic delay information on the ETA chip in the expanded Next Lesson tile, so you can see at a glance whether traffic is adding time to your route.

## Where
`src/components/instructor/UpNextExpanded.tsx` — the ETA chip at top-right of the live map strip (lines ~694–716). UI-only change. No data hooks, handlers, or queries modified — `useTrafficETA` already returns `delayMinutes` and `trafficCondition`, we're just rendering them.

## Behavior
The chip already shows `ETA {n}m`. Extend it with a delay indicator:

- **No delay (`delayMinutes` < 2)** → unchanged: green dot + `ETA 25m`
- **Light delay (2–5 min)** → amber dot + `ETA 25m · +3` (amber text for the +N)
- **Heavy delay (>5 min)** → red dot + `ETA 25m · +8` (red text for the +N)
- **Loading** → unchanged: `ETA …`
- **No data** → unchanged: `ETA —`

The dot colour reflects severity. The `+N` suffix shows minutes added vs free-flow traffic. Tabular numerals stay so the chip width is stable.

## Visual tokens
- Green (no delay): `#2d8a4e` (already in use)
- Amber (light): `#f59e0b`
- Red (heavy): `#dc2626`
- `+N` text uses the same severity colour, 600 weight, 11px

## Out of scope
- No tooltip, no popover, no new sheet
- No changes to the collapsed tile, status buttons, or any other section
- No edge function changes — `calculate-traffic-eta` already returns `delay_minutes`
