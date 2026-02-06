
## Make "Open App" Button Smaller on GPS Status Card

The offline action buttons ("Retry" and "Open App") in the `GPSStatusHero` component are currently using `size="lg"` with an explicit `h-12` class, making them too tall for the tile.

### Changes

**File: `src/components/instructor/tracking/GPSStatusHero.tsx`**

- Change both buttons from `size="lg"` to `size="default"`
- Reduce height from `h-12` to `h-10`
- Keep the `rounded-xl` and `flex-1` layout intact

Specifically:
- Line 184: `size="lg"` -> `size="default"`, `h-12` -> `h-10`
- Line 193: `size="lg"` -> `size="default"`, `h-12` -> `h-10`
- Optionally reduce the container padding from `p-4` to `p-3` (line 172) for a tighter fit
