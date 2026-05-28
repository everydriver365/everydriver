# Why the messaging screen shows a giant red "Delete" stripe

In `SwipeToReveal` (`src/components/ui/SwipeToReveal.tsx`), the red Delete action layer is rendered as an `absolute inset-y-0 right-0` button with `width: 88` **at all times**, sitting behind the foreground row.

That works for the schedule because the lesson cards have solid backgrounds covering it. But on the messaging screen, `ConversationRow` (`src/pages/InstructorUnifiedInbox.tsx` line 206) uses:

```ts
background: rowBg, // "transparent" for read, non-selected rows
```

So the red action layer shows through the transparent foreground — producing the always-visible red strip on the right of every conversation. It doesn't respond to taps because the foreground row (a full-width `<button>`) is on top of it and absorbs the click.

# Fix

Make the action layer invisible while the row is closed and fade it in as the user drags. This is one local change to `SwipeToReveal` — every consumer benefits, no per-row background hack needed.

### `src/components/ui/SwipeToReveal.tsx`
- Import `useTransform` from `framer-motion`.
- Derive `actionOpacity = useTransform(x, [-actionWidth * 0.1, 0], [1, 0], { clamp: true })`.
- Wrap the action button in a `motion.div` (or apply `style={{ opacity: actionOpacity }}` to the existing wrapper) and also set `pointerEvents` to `'auto'` when open and `'none'` when closed so it can't intercept taps while invisible.

No other files need to change. Behaviour stays identical when swiping; the only difference is the action layer is hidden at rest.

# Verification

1. `/instructor/messages` — red strip is gone on every conversation row.
2. Swipe a row left → red Delete fades in and snaps open, just like before.
3. Tap Delete or full-swipe → soft-delete still runs (`handleSwipeDeleteConversation`).
4. `/instructor/schedule` — swipe Cancel still works (the schedule rows have solid backgrounds so visually unchanged).

# Out of scope
- Not changing `ConversationRow` styling.
- Not changing the delete handler.
