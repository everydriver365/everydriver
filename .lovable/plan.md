
# Add Payment Badge and ETA to Next Lesson Tile

## What changes

The **Next Lesson** tile (the gradient card on the homepage) will be updated to:

1. **Show the pupil's credit/balance** using the same `PaymentStatusBadge` component used everywhere else in the app -- consistent styling with emerald for credit, amber for due, etc.
2. **Show expected ETA to the pupil** using the existing `useTrafficETA` hook, displaying drive time and traffic condition indicator (the same car icon + colored text used in the Next Up tile).

## Technical details

### File: `src/components/instructor/NextLessonTile.tsx`

**Query update:**
- Add `account_balance` and `prepaid_hours` to the `pupils` select fields so the balance is available.
- Update the `NextLesson` interface to include these fields.

**New imports:**
- `PaymentStatusBadge` from `./PaymentStatusBadge`
- `useTrafficETA` from `@/hooks/useTrafficETA`
- `Car`, `Loader2` from `lucide-react`

**UI additions (inside the info section):**
- Add a `PaymentStatusBadge` next to the postcode row, using the same logic as NextUpTile: if `prepaid_hours > 0`, use `prepaid_hours * 40` as the effective balance, otherwise use `account_balance`. The badge will be styled with a semi-transparent white background to remain legible on the gradient card.
- Add ETA display below the postcode: a small `Car` icon with the `etaText` value and traffic condition emoji, matching the NextUpTile style. Show a spinner while loading. The text will use `text-primary-foreground/80` to blend with the gradient background.

**Computed postcode:** Use `pupil.pickup_postcode || pupil.postcode` as the destination for the ETA hook (same priority as everywhere else).
