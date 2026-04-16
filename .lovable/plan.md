

# Making the Instructor App Feel Premium iOS-Native

## What's Already Working Well
- White tile cards with rounded corners and layered shadows
- Emoji icon set (consistent, playful)
- #F2F2F7 system background
- Frosted bottom nav with gradient accent line
- Activity rings on the hero

## Areas to Improve

### 1. Typography — Use SF Pro via System Font Stack Everywhere
Currently only `IOSPageWrapper` sets `-apple-system, 'SF Pro Text'`. The rest of the app uses Inter (Google Fonts). Apply the iOS system font stack globally to the instructor portal so all text renders in SF Pro on Apple devices and the closest native equivalent elsewhere. This alone makes the biggest difference.

### 2. Haptic-Style Micro-Interactions
- Add subtle spring animations on card taps (scale 0.97 with `transition: { type: "spring", stiffness: 400, damping: 25 }`)
- Implement press-and-hold feedback on Quick Action tiles using `whileTap`
- Add rubber-band overscroll feel on scrollable lists using `-webkit-overflow-scrolling: touch`

### 3. Blur & Transparency Refinements
- Make the header use `backdrop-filter: blur(20px) saturate(180%)` with `bg-white/80` instead of solid white — matching iOS navigation bars
- Apply the same frosted treatment to any sticky sub-headers or floating elements
- Add `backdrop-blur` to modal overlays

### 4. Smoother Page Transitions
- Wrap route changes in `AnimatePresence` with a subtle horizontal slide (like iOS push navigation)
- Use `layoutId` animations for shared elements between pages (e.g., pupil avatar transitioning from list to detail)

### 5. Refined Card Shadows & Depth
- Replace current box-shadow with a softer multi-layer system:
  ```
  box-shadow: 0 0.5px 0 rgba(0,0,0,0.04),
              0 2px 8px rgba(0,0,0,0.04),
              0 8px 24px rgba(0,0,0,0.06);
  ```
- Add `ring-1 ring-black/[0.04]` instead of `border-[0.5px]` for crisper card edges
- Use iOS-style inset separator lines (left-indented dividers) in lists

### 6. Native-Feeling Pull-to-Refresh
- Add a custom pull-to-refresh on the home page with an iOS-style spinner (not browser default)
- Use a rotating circular indicator matching system blue

### 7. Status Bar & Safe Area Polish
- Ensure `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` are used consistently
- Match the status bar background colour to the page background (#F2F2F7)

### 8. iOS-Style Section Headers
- Use uppercase, 13px, tracking-wide, muted text section headers (like iOS Settings) consistently across all pages — not just pages using `IOSSectionHeader`

### 9. Smooth Skeleton Loading
- Replace any loading spinners with iOS-style shimmer/skeleton placeholders that match card shapes
- Use a gentle pulse animation with the same rounded corners as the content they replace

### 10. Bottom Sheet Upgrades
- Use spring-based snap points on all bottom sheets (already using vaul)
- Add subtle shadow above the sheet
- Ensure the grab handle matches iOS exactly: 36px wide, 5px tall, 2.5px radius, `bg-[#c7c7cc]`

## Implementation Priority
1. **Global SF Pro font stack** — biggest bang, single CSS change
2. **Frosted glass header** — high visibility
3. **Card shadow refinement** — subtle but impactful
4. **Spring tap animations** — makes everything feel alive
5. **Page transitions** — polished navigation feel
6. **Pull-to-refresh + skeletons** — removes "web app" feel
7. **Section headers + list separators** — consistency pass

## Technical Approach
- Font: Add `font-family: -apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif` to the instructor portal root layout
- Animations: Leverage existing Framer Motion setup; add shared `springTap` config
- Frosted glass: CSS-only change to header component
- Shadows: Create a shared `iosShadow` utility or Tailwind plugin
- Transitions: Wrap instructor route outlet in `AnimatePresence`

All changes are CSS/animation-level — no data or logic changes needed.

