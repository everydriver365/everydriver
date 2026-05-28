# Why swipe-to-delete doesn't work in the schedule

`NewMobileScheduleView` wraps each lesson row in `<SwipeToReveal>`, but the child is an `<ExpandableLessonCard>` that already has two things which kill the outer swipe:

## Cause 1 — the card is its own draggable
`ExpandableLessonCard` (line 238–245) has its own `motion.div` with:
```tsx
drag={onDelete ? "x" : false}
dragConstraints={{ left: -120, right: 0 }}
```
Because the schedule passes `onDelete={handleDeleteLesson}` to the card (line 379), Framer Motion's drag handler swallows every horizontal pointer gesture before `SwipeToReveal`'s pointer handlers ever see it. The card's own "swipe to reveal a red Trash background" runs instead — but it never finishes the delete in the way the user expects, because the schedule also wraps it in `SwipeToReveal`, which never engages.

## Cause 2 — the entire collapsed card is a `<button>`
Line 291:
```tsx
<button onClick={() => !isDragging && setIsExpanded(!isExpanded)} className="w-full text-left">
  {renderCustomCollapsed ?? …}
</button>
```
And `SwipeToReveal.onPointerDown` (line 116) explicitly bails out when the touch target is inside a button/link:
```ts
if (target.closest("button,a,input,textarea,select,[role='button']")) return;
```
So even if Cause 1 were fixed, the swipe would still be ignored because the whole row counts as a button.

# Fix

Make the schedule use **one** swipe system, not two. `SwipeToReveal` is the standard one across the app (inbox, etc.), so keep that and switch the card off.

### 1. `src/components/instructor/NewMobileScheduleView.tsx`
Where `<ExpandableLessonCard>` is rendered inside `<SwipeToReveal>` (line 367–459), stop passing `onDelete` to the card so the card's internal drag is disabled:
```diff
- onDelete={handleDeleteLesson}
+ // onDelete handled by outer SwipeToReveal
```
(The `<SwipeToReveal onDelete={…}>` on line 365 keeps the delete action.)

### 2. `src/components/ui/SwipeToReveal.tsx`
Relax the pointer-down guard so a tap on a "wrapper button" (whose only job is to toggle expand) doesn't kill the swipe. Replace line 116 with a check that only bails for **leaf** interactive controls:
```ts
const interactive = target.closest("a,input,textarea,select,[role='button'],[data-no-swipe]");
const isLeafButton = target.closest("button") && !target.closest("[data-swipe-pass]");
if (interactive || isLeafButton) return;
```
Then add `data-swipe-pass` to the collapsed `<button>` in `ExpandableLessonCard.tsx` line 291 so it opts into pass-through:
```diff
- <button onClick={() => !isDragging && setIsExpanded(!isExpanded)} className="w-full text-left">
+ <button
+   data-swipe-pass
+   onClick={() => !isDragging && setIsExpanded(!isExpanded)}
+   className="w-full text-left"
+ >
```
Net effect: tap still expands the card, vertical scroll still works, horizontal drag is now captured by `SwipeToReveal` and reveals the Cancel action.

### 3. (Optional cleanup, recommended)
In `ExpandableLessonCard.tsx`, since the schedule no longer passes `onDelete`, the in-card red Trash background (line 229–236) and drag state (line 238–252) become dead code in that callsite. They're still used by `MultiDayScheduleView`, so leave the code in place but verify nothing else regresses.

# Verification

1. Open `/instructor/schedule` on mobile viewport.
2. Swipe a lesson row left → red "Cancel" action slides in.
3. Tap "Cancel" or full-swipe → `handleDeleteLesson` runs (existing cancel flow).
4. Tap the row (no swipe) → card still expands/collapses.
5. Vertical scroll of the list still works.
6. Confirm `MultiDayScheduleView` (which still uses the card's internal drag) is unaffected.

# Out of scope

- Not changing the desktop `MultiDayScheduleView` behaviour.
- Not changing the actual cancel logic — only the gesture that triggers it.
