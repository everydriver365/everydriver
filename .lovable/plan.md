

## Problem
The green "+" buttons on homepage tiles currently navigate directly to routes. The user wants them to instead open a unified quick-actions popover menu styled like the reference screenshot — a white rounded card with a vertical list of actions, each having a colored circle icon and label.

## Design (from screenshot)
- White rounded card popover, anchored near the "+" button
- Each row: colored circle icon (left) + action label (right)
- Actions: Add Lesson, Add Pupil, Track Live, Take Payment, Messages, Find My Car, Notes, Nearby ADIs
- Close "X" button at bottom-right corner
- Backdrop overlay behind the menu

## Plan

### 1. Create `QuickActionsPopoverMenu` component
A new reusable component (`src/components/instructor/QuickActionsPopoverMenu.tsx`) that renders:
- A fixed/absolute white rounded card with the action list
- Each item: a 44×44 colored circle with an icon + label text
- Colors matching the screenshot (purple for Add Lesson, blue for Add Pupil, green for Track Live, red/pink for Take Payment, cyan for Messages, orange for Find My Car, amber for Notes, purple for Nearby ADIs)
- A dark circular "X" close button at the bottom-right
- Semi-transparent backdrop overlay
- Framer Motion enter/exit animations

Action items and their routes:
- Add Lesson → `/instructor/schedule?action=add`
- Add Pupil → `/instructor/pupils?action=add`
- Track Live → `/instructor/tracking`
- Take Payment → `/instructor/take-payment`
- Messages → `/instructor/messages?action=new`
- Find My Car → `/instructor/find-my-car`
- Notes → `/instructor/notes` (or todos)
- Nearby ADIs → `/instructor/nearby-adis`

### 2. Update `QuickActionTiles.tsx`
- Add state `popoverOpen` to manage menu visibility
- Change green "+" button `onClick` to open the popover menu instead of navigating directly
- Render `QuickActionsPopoverMenu` at the bottom of the component

### 3. Update `SwipeableQuickAccess.tsx`
- Same changes: green "+" opens the shared popover menu instead of navigating

