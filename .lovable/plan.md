## Problem

On `/instructor/settings/schedule` (mobile), the day rows inside the Working Hours card look squashed against the edges. The outer page uses `px-4` (16px), the section Card adds its own `padding: "14px 16px 16px"` for the inner editor area, and each day row inside `WorkingHoursEditor` is its own bordered card with `p-3` (12px). That stacks to ~28–30px of horizontal padding before the time inputs even start, leaving them with very little width on a 390px viewport.

## Change

Single file: `src/components/instructor/settings/mobile/ScheduleMobileLayout.tsx`

1. Drop the outer page horizontal inset from `px-4` (16px) to `px-3` (12px).
2. Drop the per-section inner padding wrapper from `padding: "14px 16px 16px"` to `padding: "12px 10px 12px"`.

Result: ~12px of breathing room on the screen edge + ~10px inside the card before the day row's own border — giving the time inputs an extra ~12px of width on each side without removing the visual card containment.

## Out of scope

- No changes to `WorkingHoursEditor` itself or any other editor.
- No changes to other settings categories or any other page.
- No logic changes.
