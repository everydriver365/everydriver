

## Fix: Hero image obscured by header's navy gradient fade

### Root cause

In `InstructorMobileHeader.tsx` (lines 170-176), there's a "graduated fade" div that bleeds 48px below the header:

```css
background: linear-gradient(to bottom, 
  hsl(var(--primary)) 0%,        /* solid navy */
  hsl(var(--primary) / 0.4) 40%, /* 40% navy */
  transparent 100%
)
```

This sits at `z-40` and paints a heavy navy overlay directly on top of the hero image area. The hero image loads but is immediately covered by this gradient.

### Fix

1. **Remove the graduated fade div** from `InstructorMobileHeader.tsx` (lines 170-176). The hero already has its own subtle gradient for text readability (`from-black/30 via-transparent to-black/20`), so this extra overlay is redundant and destructive.

2. **Alternative (if some blending is desired)**: Reduce the fade to a much lighter, shorter overlay — e.g. `h-6` with `hsl(var(--primary) / 0.15)` max opacity — so the hero image remains clearly visible.

### Files changed

| File | Change |
|------|--------|
| `src/components/instructor/InstructorMobileHeader.tsx` | Remove lines 170-176 (the graduated fade div) |

No other files need changes. The hero image and its own overlay in `HomepageHero.tsx` are correct — they just need to not be covered by the header's fade.

