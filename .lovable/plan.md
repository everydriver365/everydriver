

## Fix White Safe Area on Instructor Mobile Pages

### Problem
On iOS, the status bar area (safe area inset top) shows white instead of the header's primary color. This happens because `apple-mobile-web-app-status-bar-style` is `black-translucent`, which makes the status bar transparent and shows whatever background is behind it.

### Solution
Two changes needed:

**1. `src/components/layout/InstructorPortalLayout.tsx`** — The main layout wrapping most instructor pages. The outer container (line ~400) needs its background to account for the safe area. The simplest fix: add a pseudo-element or a dedicated div at the very top that fills the safe area with the primary color, similar to what `InstructorMobileHeader` already does. However, since the header already has `bg-primary pt-[env(safe-area-inset-top)]` on line 413, the safe area should be covered. The issue may be that the `mobileBg` style on the parent div overrides things, or that when scrolling, the body background peeks through.

The most robust fix: set the **body background** to primary for instructor routes. We can do this by adding a class to the body element for instructor pages, or more practically, ensure the outer layout div has a primary-colored top section.

**Specific changes:**

1. **`src/components/layout/InstructorPortalLayout.tsx`** (line ~400-404): Add `bg-primary` to the outer wrapper so the safe area behind the sticky header is primary-colored, not white. The content area below can keep its own background via an inner wrapper.

   Wrap the content (below the header) in a div with the `mobileBg` background, and make the outer div `bg-primary` so the safe area is always primary.

2. **`src/pages/InstructorNotifications.tsx`** (line 59): Change `bg-background` to `bg-primary` on the outer div, with content wrapped in a `bg-background` inner div, so the safe area behind `InstructorMobileHeader` is primary-colored.

This ensures the safe area is always the header color on all instructor mobile pages.

