

## Plan: Remove rounded corners from Next Up tile

The outer container at line 181 has `rounded-2xl`. Change it to remove rounding, matching the reference screenshot which shows sharp corners.

### Changes

**`src/components/instructor/NextUpTile.tsx`** (line 181)
- Remove `rounded-2xl` from the outer container className
- Also remove `rounded-sm` from the accent bar (line 192) and inner div (line 194) for consistency

