

## Make Speed Limit Roundel Always Visible on Live Map

### Problem
When no speed limit data is available, the roundel renders with muted, semi-transparent styling (`bg-muted/50`, `border-muted-foreground/30`, `animate-pulse`) that blends into the map and is effectively invisible.

### Fix
Update the null/empty state in `SpeedLimitRoundel.tsx` to use the same red-border, white-background styling as the data state — just with `--` as the text. Remove the pulse animation and muted colors so it always looks like a proper UK speed limit sign.

### File Changed
- `src/components/instructor/SpeedLimitRoundel.tsx` — Change the null-state render (lines 33-39) to use the same `border-red-600 bg-white shadow-lg` styling as the populated state, displaying `--` in `text-gray-900`.

