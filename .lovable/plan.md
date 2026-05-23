## Goal

The status button rows in `src/components/instructor/UpNextExpanded.tsx` (Here / Going / Late, then Prep / Arrived) currently use fixed inline styles: 36px height, 12px font, 10px horizontal padding, 6px gap, 13px icons. On narrow phones (≤360px) the labels get cramped against the icons and the "Arrived" CTA (flex 1.6) squeezes the others until text truncates with an ellipsis.

Make these two rows degrade cleanly at small widths without wrapping or truncating.

## Changes (presentation-only, single file)

`src/components/instructor/UpNextExpanded.tsx`

1. Give each `statusBtn` a stable className (e.g. `upnext-status-btn`) and wrap the two rows in a container with class `upnext-status-row`.
2. Convert the hard-coded sizing in `statusBtn` to use CSS custom properties with sensible defaults, then override them inside the existing `<style>` block via `@media (max-width: 380px)` and `@media (max-width: 340px)`:
   - ≤380px: height 34, font-size 11.5, padding `0 8px`, gap 5, icon 12.
   - ≤340px: height 32, font-size 11, padding `0 6px`, gap 4, icon 11, and reduce the row `gap` from 6 → 4.
3. Keep `white-space: nowrap` + `min-width: 0` so flex children shrink before overflow, and keep the ellipsis as a final safety net.
4. Leave the "Arrived" CTA's `flex: 1.6` weighting but cap it at `flex: 1.3` under 340px so the secondary "Prep" button keeps a readable label.
5. No changes to colors, icons, handlers, data sources, or layout structure — purely responsive sizing.

## Out of scope

- Desktop layouts, the Row 1 vs Row 2 grouping, button order, copy, or any business logic.
- Other components on the home screen.
