

## Fix: redesign the actual + menu used on the instructor mobile home

The previous redesign updated `QuickActionsFAB`, but the mobile home's "+" button opens a different component: `QuickActionsPopoverMenu`. That's why you saw no change. This plan applies the iOS side-drawer styling to the correct component.

### What's actually wired up
- Mobile home's "+" → `QuickActionsPopoverMenu` (used by `SwipeableQuickAccess`, `QuickActionTiles`, and the header in `InstructorPortalLayout`)
- It currently renders as a small floating card above the bottom nav with 9 pinnable actions

### Change

**Rewrite** `src/components/instructor/QuickActionsPopoverMenu.tsx` to render an iOS-style left side drawer matching the reference, while keeping the existing API (`open`, `onClose`) so all three call sites keep working with no edits.

New look (same as the approved drawer design):
- Full-height drawer, slides in from the left, `min(86vw, 340px)` wide, `vaul` `direction="left"`
- Navy header (`hsl(var(--dsm-navy))`) with DSM logo, "Driving School Manager" subtitle, close `X`
- "Pinned" section (uppercase eyebrow), then "Quick Actions" section
- 56px rows: 36px circular icon chip (brand-tinted background using each action's existing color at ~12% opacity) + bold label + chevron + star/pin toggle on the right
- Tinted active state on the first pinned row (`hsl(var(--dsm-accent-blue) / 0.10)`)
- Backdrop dim + blur, swipe-to-close, safe-area padded, footer caption

### What stays exactly the same
- All 9 actions, their routes, icons, and colors (Add Lesson, Add Pupil, Track Live, Take Payment, Messages, Nearby ADIs, Availability, End of Day, Platform Updates)
- Pin/unpin behaviour and `localStorage` key (`pinned-quick-actions`)
- Pinned-first sort order
- Haptics on open / pin / select
- Component props (`open`, `onClose`) — no caller changes required

### Out of scope
- `RadialFAB` (the small Note/Navigate/Message/Break radial on mobile) — untouched
- `QuickActionsFAB` and the new `QuickActionsDrawer` from the previous round — left as-is for desktop/other use
- No data, route, or backend changes

