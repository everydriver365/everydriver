
# Safe Speed Display -- Blank Values When Offline

## What changes
When the device is offline (`isConnected = false`), speed and limit should show "—" instead of stale values, and overspeed should be `false`.

## Technical changes in `src/components/instructor/GoogleLiveTrackingMap.tsx`

**Move `overspeed`, `speedText`, and `limitText` below the `isConnected` derivation (line 105)** so they can reference it, and update their logic:

1. **`overspeed`** (currently lines 75-80): Move after line 105. Change to require `isConnected` as a precondition:
   - `isConnected && speed != null && limit != null && speed > limit + 2`

2. **`speedText`** (currently lines 82-86): Move after line 105. Blank when `!isConnected`:
   - `!isConnected || speed == null` --> "—"

3. **`limitText`** (currently lines 88-92): Move after line 105. Blank when `!isConnected`:
   - `!isConnected || limit == null` --> "—"

4. **`markerColor`** (line 107-111): Already uses `overspeed` which will now be `false` when offline, so grey will apply correctly -- no change needed.

This is a reorder + minor logic tweak within a single file. No database or backend changes.
