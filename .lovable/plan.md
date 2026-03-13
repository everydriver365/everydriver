

## Better Slot Selection UX — Sticky Calendar with Bottom Sheet Time Picker

**Problem**: On mobile (390px), the current layout stacks the calendar, time slots, and scheduled lessons vertically, forcing the user to scroll up and down repeatedly between picking a date and picking a time.

**Solution**: Use a two-part layout on mobile:
1. **Keep the calendar always visible** at the top of the scheduling section
2. **Show time slots in a sticky bottom sheet** that slides up when a date is tapped, overlaying the bottom of the screen — no scrolling needed
3. **Show scheduled lessons as compact chips** beneath the calendar (always visible) instead of a separate scrollable section

### Changes — `src/components/booking/LessonScheduler.tsx`

1. **Bottom sheet for time slots (mobile only)**:
   - When `selectedDate` is set on mobile, render the time slot grid inside a `motion.div` that slides up from the bottom of the scheduler area (not a full-screen modal — a local anchored panel).
   - Uses `position: sticky; bottom: 0` within the scroll container, or a fixed-position overlay within the booking view.
   - Includes the date label, a close/dismiss button, and the time grid.
   - Tapping a time adds the slot and keeps the sheet open (so users can add multiple slots on the same day).

2. **Compact scheduled lessons display**:
   - Replace the tall "Scheduled Lessons" card with a horizontal row of small chips directly below the calendar (e.g., "Mon 9am · 2h ✕").
   - This keeps the booked slots visible without a separate scroll section.
   - On desktop (lg), keep the existing 3-column layout unchanged.

3. **Mobile-specific layout**:
   - Wrap the `grid lg:grid-cols-3` section in a mobile check.
   - On mobile: show calendar + chips, with time picker as a bottom-anchored overlay.
   - On desktop: keep the current side-by-side 3-column grid.

### UX Flow (Mobile)
```text
┌──────────────────────┐
│  Lesson Length [2h]   │
├──────────────────────┤
│     < June 2026 >    │
│  Mo Tu We Th Fr Sa Su│
│   1  2  3  4  5  6  7│
│   8  9 10 11 12 ...  │  ← tap a date
├──────────────────────┤
│ 📌 Mon 9am·2h ✕      │  ← booked slots as chips
│    Tue 11am·2h ✕     │
├──────────────────────┤
│ ┌──────────────────┐ │  ← slides up on date tap
│ │ Wed 3 Jun        │ │
│ │ 09:00  10:00     │ │
│ │ 11:00  13:00     │ │
│ │ 14:00  15:00     │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Files to modify
- `src/components/booking/LessonScheduler.tsx` — mobile layout with bottom-anchored time picker and chip-style booked slots

