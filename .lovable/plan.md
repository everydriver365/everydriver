
## Diagnosis

On the instructor mobile schedule page (`MultiDayScheduleView`), tapping a lesson event doesn't visually open details. Root cause analysis:

1. **Lesson cards** use `ExpandableLessonCard` with a `renderCustomCollapsed` prop. The custom collapsed view is a self-contained styled `<div>` with its own white background, border, and `borderRadius: 14`. When tapped, the parent toggles `isExpanded` and renders the expanded panel **below** that styled div — but visually it appears detached/outside the "card", and there's **no chevron / affordance** so users assume nothing happened.
2. **Calendar events & manual blocks** (lines 580–686) render as inline divs with their own `onClick` toggling `expandedEventId`. These do work, but the expanded body is minimal and the click target is subtle.
3. The custom collapsed view also has no visual "pressed" state, no chevron, and no scroll-into-view when expanded — so on a tightly packed day the expansion can happen below the fold.

## Plan

### 1. Fix lesson card expansion (primary fix)
In `MultiDayScheduleView.tsx`:
- Add a small chevron indicator to the `renderCustomCollapsed` lesson div (rotates when expanded — pass `isExpanded` down via a new render-prop signature, or simpler: drop the custom border/background so the parent `ExpandableLessonCard` owns the visual frame and the expansion looks integrated).
- Preferred approach: change `renderCustomCollapsed` from a flat styled div into content that sits **inside** the parent card frame (remove inner `backgroundColor`, `border`, `borderRadius` — let `ExpandableLessonCard`'s outer container provide them). The expanded panel will then visually flow inside the same card.

### 2. Improve `ExpandableLessonCard` affordance
In `ExpandableLessonCard.tsx`:
- Always render a chevron in the top-right (even when `renderCustomCollapsed` is used) so users see the card is tappable.
- After expanding, scroll the card into view (`scrollIntoView({ block: "nearest" })`) so the details panel is visible.

### 3. Make calendar events & manual blocks consistent
In `MultiDayScheduleView.tsx` (lines 580–686):
- Add a chevron to the right of external events and manual blocks.
- Match the expanded panel styling with the lesson card so all three event types feel uniform.

### 4. Files
- EDIT `src/components/instructor/ExpandableLessonCard.tsx` — always show chevron; scroll-into-view on expand.
- EDIT `src/components/instructor/MultiDayScheduleView.tsx` — strip custom border/bg from lesson `renderCustomCollapsed`; add chevron to external events and blocks.

No DB changes. No new components.
