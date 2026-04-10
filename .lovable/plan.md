

## Why the hero image is blocked by a blue screen

The root cause is two layers of solid background covering the hero image:

1. **Outer container** (line 403): `bg-primary pb-16` — this is the blue you see. It fills the entire screen.
2. **Main content area** (line 631): `style={{ backgroundColor: mobileBg }}` where `mobileBg` defaults to `"#E8F1FE"` — another opaque background on top.

When we made the header transparent and absolute, the hero image (inside `children` / `<main>`) sits *below* the header in the DOM — but the outer container's solid `bg-primary` blue fills the gap the absolute header left behind. The main tag also paints its own opaque background over the hero.

## Fix

**File: `src/components/layout/InstructorPortalLayout.tsx`**

1. **Outer container** (line 401-404): On the homepage, change `bg-primary` to `bg-transparent` so the blue doesn't fill behind the absolute header area.
   ```
   isFullscreenMode ? "..." : isHomePage ? "pb-16" : "bg-primary pb-16"
   ```

2. **Main content area** (line 631): On the homepage, remove the inline `backgroundColor` so the hero image shows through. The hero component already has its own backgrounds.
   ```
   style={{ backgroundColor: isHomePage ? 'transparent' : mobileBg }}
   ```

These two changes will let the hero image be visible and bleed behind the transparent header as intended.

