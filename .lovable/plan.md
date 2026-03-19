

## Plan: Match iOS Safe Area Color to Header

The issue is a color mismatch between the iOS status bar area and the header. Currently:
- The CSS `--primary` = `hsl(218, 54%, 17%)` ≈ `#142741` (dark navy blue)  
- The PWA `theme-color` in `DynamicPWAMeta.tsx` = `#141b43` (dark indigo)
- The `index.html` meta `theme-color` = `hsl(218, 54%, 17%)`

These are slightly different colors, causing a visible seam on iOS between the native status bar area and the app header.

### Changes

**1. `src/components/pwa/DynamicPWAMeta.tsx`**
- Update the instructor `themeColor` from `#141b43` to the exact hex equivalent of the CSS primary: `#142741`
- Also update `default` config to match

**2. `index.html`**
- Update the `theme-color` meta tag from `hsl(218, 54%, 17%)` to `#142741` for consistency

**3. `src/components/layout/InstructorPortalLayout.tsx`**  
- Ensure the `apple-mobile-web-app-status-bar-style` meta and the safe area fill div both use the same `bg-primary` without any transparency or backdrop effects that could alter the perceived color

This ensures the native iOS status bar, the safe area fill, and the header bar all render the exact same blue.

