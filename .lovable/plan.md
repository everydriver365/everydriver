

## Next Lesson Tile: All 7 Enhancements

Applying all suggested enhancements to `src/components/instructor/NextUpTile.tsx` for a richer, more informative tile.

---

### 1. Gradient Header Strip
- Replace the flat white header area (line 148) with a subtle gradient: `bg-gradient-to-br from-primary/5 to-transparent`
- Gives the "NEXT LESSON" header visual weight without overpowering

### 2. Urgency Color Coding
- Add dynamic border-left accent based on `minutesUntil`:
  - **> 30 min**: `border-l-4 border-l-primary` (calm blue)
  - **15-30 min**: `border-l-4 border-l-amber-400` (attention)
  - **< 15 min**: `border-l-4 border-l-red-500` (urgent)
- Applied to the outer card container (line 146)

### 3. Animated Countdown Badge
- When `minutesUntil <= 30`, replace the static `(in X min)` text (lines 158-162) with a pulsing pill badge
- Uses `animate-pulse` for urgency and a colored background matching the urgency tier (emerald > 15m, amber 5-15m, red < 5m)
- Always visible when <= 30 min (not just < 60 min)

### 4. Lesson Duration Badge
- Add a small duration pill next to the time display (line 155-157)
- Shows formatted duration like "1h" or "1.5h" or "2h"
- Styled as a subtle muted badge: `bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs`

### 5. Avatar Progress Ring
- Wrap the `PupilAvatar` (lines 168-172) in a ring that indicates lesson completion progress
- Use a `ring-2` with a color based on the pupil's payment status (emerald if paid up, amber if low, red if in debt)
- Uses `ring-offset-2` for clean spacing

### 6. Improved Action Button Styling
- Update Call, Message, and On Way buttons (lines 228-256) with:
  - Gradient backgrounds: `bg-gradient-to-r from-blue-50 to-white` (Call/Message), `from-emerald-50 to-white` (On Way)
  - Tinted borders: `border-blue-200/60` (Call/Message), `border-emerald-200/60` (On Way)
  - Hover ring: `hover:ring-1 hover:ring-blue-300/50` / `hover:ring-emerald-300/50`
  - Tinted text: `text-blue-900` / `text-emerald-900`
  - Shadow: `shadow-[0_1px_4px_rgba(20,37,66,0.06)]`
- Same treatment for expanded action buttons (Cancel, View Pupil, Schedule) at lines 279-304
  - Cancel: `from-red-50`, `border-red-200/60`
  - View Pupil: `from-blue-50`, `border-blue-200/60`
  - Schedule: `from-blue-50`, `border-blue-200/60`
- Remove inline `style={{ backgroundColor: '#f5f5f5' }}` from all buttons

### 7. Card Background Gradient
- Replace flat `bg-white` on the outer card (line 146) with `bg-gradient-to-b from-blue-50/40 to-white dark:from-blue-950/10 dark:to-card`
- Tint the border: `border-blue-200/40 dark:border-blue-800/30`
- Enhance shadow: `shadow-[0_2px_12px_rgba(20,37,66,0.08)]`

---

### Technical Details

**File to modify:** `src/components/instructor/NextUpTile.tsx`

**Key changes summary:**

```
Line 146 (outer card):
- Add urgency border-left, gradient background, enhanced shadow, tinted border

Lines 148-163 (header):
- Add gradient background strip
- Replace static countdown with animated pulse badge
- Add duration pill next to time

Lines 168-172 (avatar):
- Wrap with payment-status-colored ring

Lines 228-256 (action buttons):
- Gradient bg, tinted border, hover ring, tinted text, remove inline styles

Lines 279-304 (expanded actions):
- Same gradient/border/ring treatment, remove inline styles
```

**New helper logic needed:**
- `getUrgencyColor()` function returning border/badge colors based on `minutesUntil`
- `formatDuration()` function to display "1h", "1.5h", "2h" etc.
- `getPaymentRingColor()` function based on `effectiveBalance`
