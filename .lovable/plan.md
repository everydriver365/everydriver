## Goal

iOS-style left-swipe-to-reveal-Delete on mobile lists, starting with the instructor schedule. All deletes route through the existing **soft-delete** paths (sets `deleted_at` / `status='cancelled'`, triggers Google Calendar cleanup) — no new destructive SQL.

## Approach

### 1. Build one reusable primitive

Create `src/components/ui/SwipeToReveal.tsx` — a touch-driven row wrapper that mimics iOS Mail:

- Track `pointerdown`/`pointermove`/`pointerup` (works for touch + mouse, ignores vertical scroll via direction lock).
- Reveal a red **Delete** action panel from the right as the user drags left.
- Snap points: 0px (closed), -88px (action visible), -100% (full swipe = auto-delete).
- Spring back if released below ~30% threshold.
- Tap-outside / scroll closes any open row (only one open at a time, via lightweight context).
- Accessibility: also expose the action via long-press → ActionAffordance fallback for non-touch and screen readers.
- Haptic tick on snap (Capacitor `Haptics.impact({ style: Light })` when available, no-op on web).
- Respect `prefers-reduced-motion`.

API:
```tsx
<SwipeToReveal
  onDelete={() => softDeleteLesson(id)}
  confirmLabel="Cancel lesson?"
  confirmDescription="The pupil will be notified."
>
  <LessonRow … />
</SwipeToReveal>
```
The confirm dialog reuses the existing `AlertDialog` from `cancelDialogOpen` flow, so the destructive action still surfaces a confirm — matches iOS where Delete on important items prompts.

### 2. Wire it into the schedule first

`src/components/instructor/NewMobileScheduleView.tsx` — wrap each lesson / manual-block / Google-event row in `<SwipeToReveal>`. Reuse the existing cancel handler that already does the soft-delete + Google Calendar sync.

### 3. Out of scope until confirmed

The question below decides where else to apply it on this pass.

## Technical details

**Files**
- `src/components/ui/SwipeToReveal.tsx` (new) — pointer logic, motion, single-open context.
- `src/components/instructor/NewMobileScheduleView.tsx` — wrap rows, no logic change.
- (Optional follow-ups based on Q below.)

**Constraints respected**
- Mobile-only behaviour; desktop rendering unchanged (component becomes a passthrough above `md:`).
- Existing portal radius scale (12px rows, 999px pills) preserved.
- No new RPC; reuses the soft-delete/cancel pipeline already covered by `mem://features/booking/lesson-soft-delete-pipeline`.

## Clarifying question

Where else should I apply swipe-to-delete in the same pass? (Pupils list, messages, mileage/expenses entries, pinned tiles, notifications, vehicle list, etc.) I'd like a short list rather than "everywhere" so I can confirm each has a clean soft-delete path before wiring it up.