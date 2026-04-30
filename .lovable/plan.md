## Problem

Tapping a lesson in the homepage "Today's Schedule" navigates to `/instructor/pupils/:pupilId`, but the matching pupil card does not actually expand. It only works on a cold load — repeat taps from the same pupils page silently do nothing.

## Root Cause

In `PupilCardStack.tsx` (line 195) the expanded state is initialised once from a prop:

```ts
const [isExpanded, setIsExpanded] = useState(defaultExpanded);
```

`useState` only reads `defaultExpanded` on mount. When `InstructorPupils` updates `expandedPupilId` after a route change, the already-mounted `PupilCard` ignores the new prop value, so the card stays collapsed.

A second issue: the deep-link effect in `InstructorPupils.tsx` (line 211) only sets `expandedPupilId` — it never clears or re-asserts it. If the same pupilId is re-selected (e.g. user collapsed it manually, then taps the schedule row again), `setExpandedPupilId(sameId)` is a no-op and nothing happens.

## Fix

### 1. `src/components/instructor/PupilCardStack.tsx`
Sync the local `isExpanded` state when `defaultExpanded` changes:

```ts
useEffect(() => {
  setIsExpanded(defaultExpanded);
}, [defaultExpanded]);
```

This ensures route-driven expansion works for cards that are already mounted.

### 2. `src/pages/InstructorPupils.tsx`
Make the deep-link effect idempotent so tapping the same pupil re-triggers expand + scroll:

- Watch `pupilId` from `useParams` directly (already in scope).
- When `pupilId` is present and matches a loaded pupil, always call `setExpandedPupilId(pupilId)` and re-scroll, even if it equals the current value (force by clearing then setting on next tick, or by relying on the new prop-sync effect in PupilCard which will re-expand on every render where `defaultExpanded` flips back to true).

Simplest implementation: keep the current effect but also include a small "version" bump (e.g. `setExpandedPupilId(null); requestAnimationFrame(() => setExpandedPupilId(deepLinkPupilId));`) so the prop transitions false→true and the new sync effect always re-fires.

## Verification

1. From homepage Today's Schedule, tap a live/upcoming/completed lesson row → pupil card opens and scrolls into view.
2. Collapse the card manually, return to homepage, tap the same lesson again → card re-opens.
3. Direct navigation to `/instructor/pupils/:pupilId` (cold load) → still works as before.
4. The `?pupil=` query-param fallback continues to work.

## Files Changed

- `src/components/instructor/PupilCardStack.tsx` — add `useEffect` syncing `isExpanded` to `defaultExpanded`.
- `src/pages/InstructorPupils.tsx` — make the deep-link effect re-fire for repeated taps on the same pupilId.
