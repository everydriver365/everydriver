

# Match iPhone Safe Areas to Instructor Header Color

## What's happening now
The instructor mobile app header uses a frosted white glass (`bg-white/80 backdrop-blur-xl`), but the iPhone status bar safe area is colored `#142741` (dark navy) via the `theme-color` meta tag. This creates a visual mismatch — the status bar area appears dark while the header below it is white.

## Changes

### 1. `src/components/pwa/DynamicPWAMeta.tsx`
- Update the `instructor` config's `themeColor` from `"#142741"` to `"#FFFFFF"` so the iPhone status bar area matches the white frosted header.

### 2. `index.html`
- Update the default `<meta name="theme-color" content="#142741" />` to `"#FFFFFF"` so it matches on first load before the dynamic script runs.

### 3. `src/components/instructor/InstructorMobileHeader.tsx`
- Line 78: the safe area fill div already uses `bg-white/80` — no change needed, it already matches.

### 4. `src/index.css`
- Line 386-388: Update the `html` background-color rule to also account for the white safe area on instructor routes (the current `hsl(var(--background))` should already resolve to the right value, but we'll verify it works correctly with the white theme-color).

### Result
The iPhone status bar, notch area, and bottom home indicator will all appear white, seamlessly blending with the frosted glass header and bottom nav.

