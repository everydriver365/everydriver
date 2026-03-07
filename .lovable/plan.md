

## Premium iOS-Feel Enhancements for the Instructor Mobile App

Your app already has a strong foundation — iOS-style 20px radius cards, haptic feedback, glassmorphism utilities, dark/OLED modes, and custom icon assets. Here are targeted upgrades that will push it into premium territory.

---

### 1. SF Pro-Style Typography with System Font Stack

**What**: Replace Inter with the native iOS system font (`-apple-system, SF Pro`) as the primary font on mobile, keeping Inter as the web fallback. This instantly makes every screen feel like a native Apple app.

**How**: Update `tailwind.config.ts` font family to prioritise `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text'` before Inter. Add `font-feature-settings: "kern"` and `-webkit-font-smoothing: antialiased` globally.

---

### 2. Animated Page Transitions (Shared Element Feel)

**What**: Slide-in/slide-out transitions between instructor pages — forward navigation slides left, back navigation slides right, matching iOS UINavigationController behaviour.

**How**: Create an `AnimatedRoutes` wrapper using Framer Motion's `AnimatePresence` with `variants` that detect navigation direction (push vs pop). Wrap the instructor route outlet with this component. Transitions: 300ms ease-out, slight opacity fade.

---

### 3. Pull-to-Refresh on Key Pages

**What**: Native-feel pull-to-refresh gesture on the home dashboard, schedule, and pupil list. Shows a spinning indicator that stretches down like iOS.

**How**: Create a reusable `PullToRefresh` wrapper component using touch event handlers (`touchstart`, `touchmove`, `touchend`) with a spring-animated indicator. Trigger `queryClient.invalidateQueries()` on release. Include haptic feedback at the threshold.

---

### 4. iOS-Style Segmented Controls

**What**: Replace standard tab bars on pages (Schedule, Money, Pupils) with native-looking iOS segmented controls — pill-shaped sliding background indicator that animates between segments.

**How**: Create an `IOSSegmentedControl` component with a `motion.div` background pill that uses `layoutId` for smooth segment transitions. Styled with `bg-[#E5E5EA]` background and white active segment with shadow.

---

### 5. Context Menus with Long-Press (Haptic)

**What**: Long-press on lesson cards, pupil rows, or payment items to reveal a floating context menu (like iOS 3D Touch / Haptic Touch menus) with quick actions.

**How**: Create a `HapticContextMenu` component wrapping Radix `ContextMenu` with the existing `useLongPress` hook and `triggerHaptic('medium')`. Add blur/scale animation to the background. Actions: Edit, Cancel, Message, Navigate.

---

### 6. Large Title Headers with Scroll Collapse

**What**: iOS-style large title headers that shrink into the navigation bar on scroll — like Settings, Messages, and Mail on iPhone.

**How**: Create a `CollapsibleLargeTitle` component that tracks scroll position via `IntersectionObserver`. Title starts at 34px bold below the nav bar, collapses into the sticky header at 17px semibold as the user scrolls. Apply to home, schedule, pupils, and money pages.

---

### 7. Smooth Sheet Presentations (Half-Sheet Detents)

**What**: Bottom sheets that snap to multiple heights (quarter, half, full) like iOS sheet presentations, with a drag handle and velocity-based snapping.

**How**: Enhance the existing `vaul` drawer usage by adding detent stops. Create an `IOSSheet` wrapper with configurable snap points (`[0.25, 0.5, 1]`), rubber-band overscroll at edges, and dismiss-on-fling-down.

---

### 8. Subtle Micro-Animations Throughout

**What**: Add small polish animations that make the app feel alive:
- Number counters that animate up (earnings, lesson counts)
- Badge counts that bounce-scale when changing
- Card press states with subtle depth shadow changes
- Success checkmarks that draw-on with SVG path animation

**How**: Create utility components — `AnimatedCounter` (counts up with `useSpring`), `BounceBadge` (scales on value change), and `DrawCheckmark` (SVG stroke animation). Apply across dashboard tiles, payment confirmations, and lesson completions.

---

### 9. Blur-Behind Navigation Bars

**What**: Make the top header and bottom nav translucent with a frosted-glass blur effect, so content scrolls behind them — exactly like Safari and iOS system apps.

**How**: Update `InstructorMobileHeader` and `InstructorBottomNav` to use `backdrop-blur-xl bg-primary/80` (header) and `backdrop-blur-xl bg-[#f2f2f7]/80` (bottom nav). Add `backdrop-saturate-150` for the characteristic iOS vibrancy. Ensure content has proper scroll padding.

---

### 10. Rubber-Band Overscroll

**What**: Add elastic overscroll behaviour on scrollable lists so they bounce at the edges like native iOS.

**How**: Add CSS `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain` to scrollable containers. For the custom pull-to-refresh, use spring physics with damping for the rubber-band effect.

---

### Summary of Files

| Enhancement | Files to Create/Modify |
|---|---|
| SF Pro Typography | `tailwind.config.ts`, `index.css` |
| Page Transitions | New `AnimatedRoutes.tsx`, instructor layout wrapper |
| Pull-to-Refresh | New `PullToRefresh.tsx`, home/schedule/pupils pages |
| Segmented Controls | New `IOSSegmentedControl.tsx`, schedule/money/pupil pages |
| Context Menus | New `HapticContextMenu.tsx`, lesson cards, pupil rows |
| Large Title Headers | New `CollapsibleLargeTitle.tsx`, key pages |
| Sheet Detents | New `IOSSheet.tsx` or enhance existing vaul usage |
| Micro-Animations | New `AnimatedCounter.tsx`, `BounceBadge.tsx`, `DrawCheckmark.tsx` |
| Blur Nav Bars | `InstructorMobileHeader.tsx`, `InstructorBottomNav.tsx` |
| Rubber-Band Scroll | `index.css`, scrollable container components |

No database changes required — these are all frontend/UI enhancements.

