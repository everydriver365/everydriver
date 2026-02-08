
# Highlight Upcoming Test Tiles at 14 Days

## Overview
When a pupil's driving test is 14 days or fewer away, their tile in the Upcoming Tests widget will be highlighted with a red border and background to draw the instructor's attention.

## What Changes

**File: `src/components/instructor/UpcomingTestsView.tsx`**

The individual test tile (line 401-444) currently uses a static class: `rounded-lg border bg-card p-3 space-y-2`.

This will be updated to calculate `daysUntil` for each pupil's test date and conditionally apply styling:

- **14 days or fewer**: Red-tinted background (`bg-red-500/10`), red border (`border-red-500/40`), with a subtle "Test Soon" badge
- **More than 14 days**: Keep the current neutral `bg-card border` styling

The existing `CountdownTimer` component already turns urgent (destructive/pulsing) at 3 days. This new highlight at 14 days provides an earlier visual warning at the tile level.

## Technical Detail

```
For each pupil tile:
  daysUntil = differenceInDays(parseISO(pupil.test_date), today)
  if daysUntil <= 14:
    tile classes: "border-red-500/40 bg-red-500/10 dark:bg-red-500/15"
  else:
    tile classes: "border bg-card"
```

No database changes required. Single file edit only.
