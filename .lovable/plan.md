## Replace car icon with blue arrow on Instructor Live Track

The car silhouette shown on `/instructor/live` is rendered as an inline SVG marker inside `SatNavLiveMap.tsx` (the `getArrowIcon` callback, lines ~423–459). Despite the function name, it currently draws a red top-down car. Replace its SVG body with a blue navigation chevron that rotates with heading.

### Change
In `src/components/instructor/tracking/SatNavLiveMap.tsx`, swap the multi-rect `carShape` for a single chevron path:

```
<path d="M28 6 L46 46 L28 38 L10 46 Z"
      fill="#2B7BC8" stroke="#ffffff"
      stroke-width="2" stroke-linejoin="round"/>
```

- Keep the 56×56 viewbox, rotation transform, and anchor so heading rotation and the accuracy halo continue to work unchanged.
- Bump opacity to `active ? 1 : 0.55` so the arrow reads clearly (the car was deliberately faded).
- Uses the mobile instructor blue `#2B7BC8` (Core memory) with a white outline for contrast on light/dark/satellite tiles.

No other files change; the shadow disc, info window, polylines and recenter logic all stay as-is.
