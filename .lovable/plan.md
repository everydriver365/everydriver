# Remove the Tip of the day card

Drop the rotating tip/"Heads up" card at the bottom of the calm hero on the instructor mobile home page.

## Changes — `src/components/instructor/CalmHomeHeader.tsx`

- Remove the `<TipOfDayCard tip={tip} … />` render at the end of the hero.
- Remove the now-unused `TipOfDayCard` component, `Tip` interface, `TIPS` array and the `tip = useMemo(...)` lookup.
- Remove the `ArrowRight` import (only used by the tip card).

No other surfaces reference these tips, and no data hooks need to change. The 2×2 dashboard grid becomes the last element in the hero.
