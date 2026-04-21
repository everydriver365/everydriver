

## Plan: Restore visible lift on instructor mobile tiles

### Problem

The "deep-lift" shadow we set on `.shadow-premium` (`0 4px 10px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.12)`) isn't visually landing on the home screen. Three likely causes — all need fixing together:

1. **Background contrast is too low.** The instructor portal background is `#EEF1F5` (very close to white). A soft black shadow on near-white reads as almost nothing. Either the bg or the shadow needs more contrast.
2. **Tiles still render with a hairline border.** `IOSTile`, `IOSTileGroup`, and `InstructorCard` set `border: 0.5px solid rgba(15,23,42,0.06)`. The border visually "absorbs" the shadow edge so the lift disappears.
3. **Shadow is too soft for a near-white surface.** On `#EEF1F5`, alpha 0.08/0.12 black barely registers. Needs stronger, slightly cooler shadow tuned for light grey surfaces.

### Fix

**1. Strengthen `.shadow-premium` in `src/index.css`** to a tuned 3-layer shadow that reads on light grey:

```css
.shadow-premium {
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 6px 14px rgba(15, 23, 42, 0.10),
    0 18px 36px rgba(15, 23, 42, 0.14);
}
.shadow-premium-lg {
  box-shadow:
    0 2px 4px rgba(15, 23, 42, 0.08),
    0 10px 22px rgba(15, 23, 42, 0.14),
    0 24px 48px rgba(15, 23, 42, 0.18);
}
```

Pressed state stays as the existing reduced shadow + `translateY(2px)`.

**2. Remove the hairline borders on tile primitives** so the shadow is the only separator:

- `src/components/instructor/IOSTile.tsx` — drop `border: 0.5px solid rgba(15,23,42,0.06)` from both `IOSTileRoot` and `IOSTileGroup`.
- `src/components/instructor/InstructorCard.tsx` — already borderless, just confirm.
- `src/components/instructor/WarmTile.tsx` — drop any border on the tile root if present.

**3. Ensure the shadow class is actually applied to home-screen tiles.** Audit the four files rendering on `/instructor` mobile home and add `shadow-premium` where it's missing:

- `ActivityTilesGrid` "All clear" pill (currently uses an inline `boxShadow` that's too soft — replace with class).
- `WarmTile` root wrapper.
- `TodayOverviewStrip` gradient card.
- `GapFillCard`, `TodayAtAGlance` Card, and any `Card`-based tiles on the home screen.

**4. Dark-mode override** stays as-is (already strong enough on dark bg), scoped under `.instructor-portal.dark`.

### Files to edit

- `src/index.css` — strengthen `.shadow-premium` / `.shadow-premium-lg`
- `src/components/instructor/IOSTile.tsx` — remove hairline borders
- `src/components/instructor/WarmTile.tsx` — ensure `shadow-premium` applied, remove any border
- `src/components/instructor/ActivityTilesGrid.tsx` — replace inline shadow with class
- `src/components/instructor/TodayOverviewStrip.tsx` — add `shadow-premium`, drop `border-primary/20` if it competes
- `src/components/instructor/TodayAtAGlance.tsx` — add `shadow-premium` to the `Card`
- `src/components/instructor/GapFillCard.tsx` — add `shadow-premium`, drop dashed border if needed

### QA

After changes, view `/instructor` at 390px and confirm every white tile (Job offers, Messages, Tests, Fill gaps, Today strip, Next lesson, Telematics) clearly lifts off the `#EEF1F5` background with a visible soft shadow halo. Press a tile to confirm the pressed state still drops it down.

