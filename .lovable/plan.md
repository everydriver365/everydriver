
# Remove Border Radius From All Quick Action Tiles

## Problem
The previous changes were applied to the wrong file (`HomeQuickActions.tsx`). The tiles actually displayed on the `/instructor` page come from `QuickActionTiles.tsx`, which still uses `rounded-2xl` and `rounded-xl`.

## Changes

**File: `src/components/instructor/QuickActionTiles.tsx`**

Remove all border-radius from tile containers:

1. **Line 283** (edit mode tiles): `rounded-2xl` to `rounded-none`
2. **Line 331** (add tiles section): `rounded-xl` to `rounded-none`
3. **Line 334** (add tile icon): `rounded-lg` to `rounded-none`
4. **Line 369** (first tile, full-width): `rounded-2xl` to `rounded-none`
5. **Line 371** (first tile icon container): `rounded-xl` to `rounded-none`
6. **Line 447** (grid tiles): `rounded-xl` to `rounded-none`
7. **Line 449** (grid tile icon container): `rounded-lg` to `rounded-none`

Note: The icon containers inside tiles will also be changed to square corners for consistency. The loading skeleton tiles (lines 221-224) will also be updated from `rounded-xl` to `rounded-none`.
