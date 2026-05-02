## Goal

Make the live vehicle marker on the Sat-Nav map feel continuous and smooth instead of jumping every 2-5 seconds.

## Two-part approach

### 1. Drop poll interval from 2s → 1.5s

In `src/pages/InstructorLiveSession.tsx` (line 395), change the `radius-poller` invocation interval from `2000ms` to `1500ms`. Modest 25% improvement in fix freshness with minimal extra cost. The 5s fallback device poll stays as-is.

### 2. Client-side marker smoothing (the big win)

In `src/components/instructor/tracking/SatNavLiveMap.tsx`, add an animation loop that interpolates the marker between known GPS fixes so movement looks continuous at 60fps even when fixes arrive every 2-5s.

**How it works:**
- When a new `(latitude, longitude, heading)` arrives, store it as the new "target" and remember the previous "from" position + timestamp.
- A `requestAnimationFrame` loop runs continuously while tracking is active. Each frame it computes `t = elapsed / expectedFixInterval` (clamped 0..1) and sets the marker position to `lerp(from, target, easeInOut(t))`. Heading is interpolated via shortest-arc rotation.
- Polyline trail still appends only on real GPS fixes (no fake points written to history).
- Camera `panTo` follows the interpolated position each frame for smooth scroll.
- Expected fix interval is tracked dynamically (rolling average of last 3 gaps, clamped 1.5s–6s) so smoothing self-tunes to actual hardware cadence.

**Refs added:**
```tsx
const animRef = useRef<number | null>(null);
const fromPosRef = useRef<{lat:number;lng:number;heading:number;t:number} | null>(null);
const targetPosRef = useRef<{lat:number;lng:number;heading:number;t:number} | null>(null);
const fixGapsRef = useRef<number[]>([]); // rolling avg of fix intervals
```

**Behaviour preserved:**
- Off-center look-ahead pan (30% from bottom)
- Two-tone polyline casing
- Heading-up rotation, arrow scale, decluttered styles
- Trail history still drawn from real fixes only

### Files to edit

- `src/pages/InstructorLiveSession.tsx` — single number change (2000 → 1500)
- `src/components/instructor/tracking/SatNavLiveMap.tsx` — add smoothing animation loop

### Result

- Vehicle glides smoothly along the road instead of teleporting
- Heading rotates fluidly instead of snapping
- No extra server cost beyond the 25% poll bump
- Trail accuracy unchanged (still real GPS points only)
