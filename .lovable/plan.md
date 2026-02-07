

# App-Style Icon Grid for Quick Actions

## Overview

Replace the current layout (1 full-width hero tile + 2-column list) with an **app launcher style** grid -- similar to how iOS/Android home screens display apps: a grid of circular/rounded icons with labels underneath, evenly spaced.

## Visual Design

```text
+----------+----------+----------+
|          |          |          |
|  (icon)  |  (icon)  |  (icon)  |
| Schedule |  Pupils  |   Jobs   |
|          |          |          |
+----------+----------+----------+
|          |          |          |
|  (icon)  |  (icon)  |  (icon)  |
| Tracking | Messages | Settings |
|          |          |          |
+----------+----------+----------+
```

Each tile will be a centered column with:
- A circular icon container (colored background matching existing accent palette)
- The tile label below in small text
- Badge counts overlaid on the icon circle (top-right)
- Tap animation for feedback

## What Changes

### File: `src/components/instructor/QuickActionTiles.tsx`

**Normal view mode (lines 360-467)** will be replaced:

- Remove the split layout (full-width first tile + 2-column grid for the rest)
- Replace with a single **4-column grid** (`grid-cols-4`) treating all tiles equally
- Each tile renders as a vertically centered icon + label
- Icon container: `w-12 h-12 rounded-full` with the existing accent color backgrounds (`bg-violet-500/15`, `bg-emerald-500/15`, `bg-rose-500/15`)
- Label: `text-[11px] font-medium text-center` below the icon
- Remove the detailed schedule info (lesson count, hours, earnings, postcode) from the first tile -- all tiles are equal in this layout
- Keep badge count overlays (job offers, unread messages) on the icon circles
- Keep `whileTap={{ scale: 0.95 }}` for press feedback

**Edit mode** stays unchanged (drag-and-drop reordering list).

### No other files need to change

- No database changes
- No new dependencies
- Existing tile customization (add/remove/reorder) continues to work identically

