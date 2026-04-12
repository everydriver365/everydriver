

## Make all instructor tiles consistently rounded

Several tiles in the instructor mobile app are missing `rounded-2xl`, causing them to appear with sharp/square corners instead of the standard 16px border radius.

### Tiles to fix

| File | Element | Current | Fix |
|------|---------|---------|-----|
| `EarningsSummaryStrip.tsx` (line 18) | Inner container | No rounding | Add `rounded-2xl` |
| `TodoHomeTile.tsx` (line 93) | Outer wrapper | No rounding | Add `rounded-2xl` |
| `QuickStatsChips.tsx` (line 104) | Chip buttons | No rounding | Add `rounded-full` (pill shape, consistent with chip pattern) |
| `TodoHomeTile.tsx` (line 100) | Badge span | No rounding | Add `rounded-full` |

### What stays the same
- `NextUpTile.tsx` — already has `rounded-2xl`
- `ActivityTilesGrid`, `InsightTilesGrid`, `ReadyToTeachTile`, `BottomPromoGroup`, `PupilCardStack` — already rounded
- `TodayLessonsList.tsx` — uses inline `borderRadius: 16` (equivalent)

### Implementation
Add the missing `rounded-2xl` (or `rounded-full` for pill-shaped chips/badges) class to the four elements listed above. No structural changes needed.

