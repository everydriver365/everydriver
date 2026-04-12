

## Plan: Add rounded corners back to the Next Up tile

The "Next Up" tile (the main tile under the "Your Day" section) currently has no border-radius after a previous change removed it. You want it rounded to match the rest of the app.

### Changes

**`src/components/instructor/NextUpTile.tsx`**
- Line 181: Add `rounded-2xl` to the outer container className
- Line 192: Add `rounded-sm` to the accent bar for smooth top corners
- Line 194: Add `rounded-sm` to the inner content div

This restores the consistent `rounded-2xl` design language used across all other tiles.

