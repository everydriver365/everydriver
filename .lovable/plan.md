

## Plan: Remove Mobile Header, Relocate Buttons

### Current State
The instructor mobile app has a **sticky primary-colored header** (lines 357-559 of `InstructorPortalLayout.tsx`) containing:
- Hamburger menu (opens sidebar nav)
- EveryDriver logo
- Notification bell
- Settings dropdown
- Search button
- Availability calendar button
- Pay button
- Quick-actions (+) button

Below the header, the homepage renders `IOSNativeHomeView` which has its own hero section with the instructor name, welcome text, and stats panel.

Sub-pages (messages, pupils, etc.) have no hero — they go straight into content with `px-4 py-4` padding.

### Approach

**1. Homepage: Merge header buttons into the IOSNativeHomeView hero**

- Remove the layout header when on the homepage (`/instructor`)
- Add the hamburger, bell, settings, search, pay, and (+) buttons into the top of the IOSNativeHomeView hero gradient area
- Layout: hamburger on the left, logo center or left, action buttons clustered on the right — similar to current header but rendered inside the hero's gradient background
- The hero already has a gradient background so the buttons will visually merge with it

**2. Sub-pages: Create a lightweight in-content top bar**

- On non-homepage sub-pages, instead of the sticky primary header, render a slim contextual bar at the top of the page content area
- This bar will contain: hamburger (left), page title (center), and key action buttons (right: bell, settings, search, pay, +)
- Styled to match the page background (wallpaper color) rather than the solid primary block, with frosted glass or subtle card styling
- Still sticky at the top for accessibility

**3. Technical implementation**

- **InstructorPortalLayout.tsx**: Conditionally hide the current `<header>` block on mobile. Instead, pass the necessary callbacks (setShowPaymentSheet, setMobileSearchOpen, setIsMobileMenuOpen, etc.) as context or props to child components
- Create a new **`InstructorMobileTopBar`** component that renders the action buttons in a transparent/wallpaper-matching bar, used on sub-pages
- **IOSNativeHomeView**: Add a top row inside the hero gradient with the hamburger + action buttons, replacing the current simple name/car-icon header
- The sidebar Sheet, search overlay, payment sheet, and QR modal will remain in the layout component — only the trigger buttons move
- Keep `safe-area-inset-top` padding for iOS notch compatibility

**4. Files to modify**

| File | Change |
|------|--------|
| `src/components/layout/InstructorPortalLayout.tsx` | Hide `<header>` on mobile; create context/callbacks for button actions; render new top bar on sub-pages |
| `src/components/instructor/IOSNativeHomeView.tsx` | Add hamburger + action buttons row at top of hero |
| New: `src/components/instructor/InstructorMobileTopBar.tsx` | Reusable transparent top bar with all action buttons for sub-pages |

**5. Risks and mitigations**

- The sidebar Sheet is currently defined inside the header — it needs to remain in the layout but have its trigger relocated. We'll keep the Sheet in the layout and pass `onOpenMenu` callback down.
- Search overlay is positioned relative to the old sticky header (`top-14`) — will need repositioning.
- Safe area handling must be preserved on both homepage hero and sub-page top bar.

