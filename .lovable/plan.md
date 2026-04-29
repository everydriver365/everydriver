## The problem with today's Quick Actions

Tapping the **+** in the header opens a full-height **left-side drawer** (`QuickActionsPopoverMenu`) that:

- Slides in from the **wrong edge** for a + that lives on the **right** of the header (eyes/finger have to cross the screen).
- Reuses a **menu/drawer chrome** (logo, title, close button, "QUICK ACTIONS" caption) for what is really a 6-item launcher — high friction, lots of scaffolding for one tap.
- Uses a **vertical list of rows**, which wastes space and makes each target a long horizontal strip rather than a thumb-friendly target.
- Is **not contextual** — same 6 actions everywhere, even when 80% of taps from the home screen go to "Add lesson" or "Take payment".
- Has **no keyboard shortcut, no long-press, no swipe** — only the one entry point.

## Recommended approach (better, in priority order)

### 1. Bottom-sheet grid (primary fix — biggest UX win)

Replace the left drawer with a short **bottom sheet** opened from the +.
Reasons it's better on mobile:

- Slides up from the **thumb zone** — reachable one-handed on a 6.7" phone.
- Native iOS / Android pattern users already understand (Share sheet, Apple Wallet "+").
- Renders 6 actions as a **3×2 icon grid** — each tile is a square ~96px tap target instead of a 56px row.
- Auto-sizes to content (~280px tall) instead of consuming the full viewport, so the home screen stays partially visible behind it (context preserved).
- Drag-to-dismiss + tap-outside, both already supported by `vaul`.

Layout sketch:

```text
┌─────────────────────────────┐
│        ─── handle ───       │
│  Quick actions              │
│ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │ +📅 │ │ +👤 │ │ 📍  │     │
│ │Less.│ │Pupil│ │Track│     │
│ └─────┘ └─────┘ └─────┘     │
│ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │ £   │ │ 💬  │ │ ⏰  │     │
│ │Pay  │ │Msg  │ │Avail│     │
│ └─────┘ └─────┘ └─────┘     │
└─────────────────────────────┘
```

Keep the same 6 actions and colour tokens already defined — only the container and layout change.

### 2. Contextual ordering

Re-order the grid based on **the page the user is on**:

- On `/instructor` (home) → Add lesson, Take payment, Add pupil, Track live, Messages, Availability.
- On `/instructor/pupils` → Add pupil first.
- On `/instructor/schedule` → Add lesson + Availability first.
- On `/instructor/messages` → Messages (new chat) first.

A tiny `getOrderedActions(pathname)` helper in the popover component, no new data plumbing.

### 3. Long-press the + for the #1 action

Long-press on the header **+** triggers the **most-used action** directly (default: Add lesson) without opening the sheet. Saves a tap for power users; surfaces via a one-time tooltip on first install.

### 4. Pin user-chosen favourites (later, optional)

Add a "Pin" affordance via long-press on a tile. Pinned actions move to the top row and persist via the existing `useInstructorTilePreferences` hook. Lets each instructor curate their own 3 most-used actions.

### 5. Retire the left drawer entirely

Remove `QuickActionsPopoverMenu`'s left-drawer chrome (logo header, full-height layout, close button) — those belong to the main side menu, not a quick launcher. Avoids users confusing the two drawers.

## Technical changes

Files to touch:

- **`src/components/instructor/QuickActionsPopoverMenu.tsx`**
  Switch `DrawerPrimitive` direction from `"left"` to `"bottom"`. Replace the rows with a grid of `QuickActionTile` cells (3 cols, ~96px square, icon-on-coloured-circle + label below). Drop the logo/title header — keep just a drag handle and the "Quick actions" caption. Add the `getOrderedActions(pathname)` re-sort.

- **`src/components/instructor/ui/QuickActionTile.tsx`** (new, ~40 lines)
  Square tile mirroring the existing `QuickActionRow` colour palette so nothing else needs restyling.

- **`src/components/instructor/MobileBlueHeader.tsx`**
  Add a `useLongPress` handler on the **+** button → navigates straight to `/instructor/schedule?action=add` and fires `haptics.medium()`. Tap behaviour unchanged.

- **`src/hooks/useLongPress.ts`** — already exists, just import it.

No database, no new routes, no new dependencies (vaul already supports `direction="bottom"`).

## What stays the same

- The same six actions, routes, colours, and icons.
- The `+` icon position in the header.
- The side **menu** drawer (different component, different purpose) is untouched.

## Out of scope

- Adding new quick actions (e.g. "Start lesson", "Log mileage") — happy to do in a follow-up.
- Voice-triggered quick actions.
- Desktop quick action bar (`DesktopQuickActionBar`) — already a different, working pattern.
