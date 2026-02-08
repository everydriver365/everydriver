
# Make Tiles Stand Out from Background

## The Problem
The tiles currently have minimal visual separation from the light grey (#f5f5f5) background -- they use `rounded-none` (sharp corners), a very subtle shadow, and `bg-white` with a thin border. This makes them blend in.

## Proposed Changes (in `QuickActionTiles.tsx`)



### 2. Strengthen the shadow
Upgrade from `shadow-[0_2px_8px_rgba(20,37,66,0.08)]` to `shadow-[0_2px_12px_rgba(20,37,66,0.12)]` -- a slightly deeper, more visible shadow that lifts tiles off the page.


### Tiles affected
- **First tile** (full-width, line ~437): rounded corners + stronger shadow + no border
- **Grid tiles** (2-column, line ~525): rounded corners + stronger shadow + no border
- **Loading skeletons** (line ~289): match the new rounded style
- **Edit mode tiles** (line ~351): rounded corners on the dashed-border drag items

## Technical Details

All changes are in `src/components/instructor/QuickActionTiles.tsx`:

- Lines ~289: Loading skeleton `rounded-none` to `rounded-xl`
- Lines ~351: Edit mode items `rounded-none` to `rounded-xl`
- Lines ~399: Add-tile items `rounded-none` to `rounded-xl`
- Lines ~437: First tile `rounded-none` to `rounded-xl`, shadow upgrade, remove border
- Lines ~525: Grid tiles `rounded-none` to `rounded-xl`, shadow upgrade, remove border
