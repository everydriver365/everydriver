

## iOS Health-Style Progress Circles

Transform all circular progress indicators from flat single-colour rings into Apple Health-style rings — thick strokes with vibrant gradients, rounded caps, subtle glow, and a shadow at the progress tip.

### iOS Health Ring Characteristics
- **Thick stroke** (~12px instead of 8px)
- **Linear gradient** along the arc (e.g. green→cyan for readiness, blue→purple for goals)
- **Rounded `strokeLinecap`** with a dot/shadow at the leading edge
- **Soft glow** behind the coloured arc (`filter: drop-shadow`)
- **Dark/muted track** ring underneath (very subtle, ~10% opacity)
- **Bold centre text** with SF-style weight

### Files to Update

| Component | Location | Current Style |
|-----------|----------|---------------|
| `TestReadinessScore` | `src/components/instructor/TestReadinessScore.tsx` | Flat 8px stroke, single colour |
| `TestReadinessCard` | `src/components/pupil-portal/TestReadinessCard.tsx` | Same flat ring |
| `WaterIntakeTracker` | `src/components/instructor/health/WaterIntakeTracker.tsx` | Flat blue ring |
| `HomepageHero` | `src/components/instructor/HomepageHero.tsx` | Already has gradient — refine glow |
| `WeeklyGoalRing` | `src/components/instructor/WeeklyGoalRing.tsx` | Already has gradient + glow |
| `MoneyHeroCard` | `src/components/instructor/money/MoneyHeroCard.tsx` | Flat ring |
| `LearnerDrivingScore` | `src/components/pupil-portal/LearnerDrivingScore.tsx` | Flat ring |
| `ContextualHomeHero` | `src/components/instructor/ContextualHomeHero.tsx` | Flat emerald ring |

### Changes Per Ring

For each component:
1. Increase `strokeWidth` from 8 → 12
2. Add SVG `<linearGradient>` with colour-appropriate stops (e.g. red→orange for low readiness, green→cyan for high)
3. Apply `filter="drop-shadow(0 0 6px rgba(color, 0.4))"` on the progress arc
4. Reduce track ring opacity to 8-10%
5. Add a small circle at the arc tip for the "cap shadow" effect Apple uses
6. Ensure `strokeLinecap="round"` on all arcs

### Gradient Colour Map
- **Test Readiness**: Maps to score — red→orange (low), orange→yellow (building), yellow→green (nearly), green→cyan (ready)
- **Water Intake**: Blue→cyan
- **Money/Goals**: Green→emerald
- **Weekly Goal**: Keep existing gradient, add glow refinement
- **Driving Score**: Maps to score colour

