
## Issue
The "Next lesson", "Today's schedule", and "Quick actions" sections render narrower than the top tiles (Action needed / Activity tiles / Telematics) because they get **double horizontal padding**:

- `InstructorMobileHome.tsx` wraps them in `<div className="px-4">` (16px)
- Each child component (`NextUpTile`, `HomeTodaySchedule`, `SwipeableQuickAccess`) also applies its own `padding: "0 16px"` internally

Result: 32px total horizontal padding vs 16px on the top tiles — visible width inconsistency.

The top tiles (`WarmHomeTiles`, `ActivityTilesGrid`, `TelematicsTile`) all manage their own 16px padding without an outer wrapper.

## Fix (single file)

**`src/components/instructor/InstructorMobileHome.tsx`** — remove the outer `px-4` wrappers for these three sections so the children's own 16px padding is the only source of horizontal inset. They will then align flush with the top tiles.

Specifically, around lines 558–606:

1. Change the outer `<div className="px-4">` wrapping the Your Day block (Next lesson + HomeTodaySchedule) to a plain `<div>` (drop `px-4`).
2. The "Quick actions" section header (`SectionHeader`) is currently un-padded inside that `px-4` wrapper — wrap just the `<SectionHeader title="Quick actions" …/>` in its own `style={{ padding: "0 16px" }}` so it stays aligned, since `SwipeableQuickAccess` already self-pads.
3. Same for the empty state (`<QuietDayEmpty />`) — give it its own padded wrapper since it previously inherited `px-4`.

No changes to `NextUpTile.tsx`, `HomeTodaySchedule.tsx`, or `SwipeableQuickAccess.tsx` — their internal 16px padding is already correct and matches the top tiles.

## Untouched
- All data hooks, routes, tap behaviour
- All visual styling within the tiles themselves
- All other sections (`PupilMilestoneFeed`, `ImpactAlertCard`, etc.) keep their existing `px-4`
