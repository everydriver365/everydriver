

## Make the Graduated Header Effect Visible

### Problem
The current gradient (100% → 70% opacity) is barely perceptible because it's contained within the small header bar itself. The VW reference shows the brand color extending **below** the header and fading out into the page content.

### Solution
Add a **gradient overlay element** that extends below the header bar and fades from the primary color to transparent. This creates the dramatic "graduated color from safe area" effect seen in the reference.

### Technical Change — `InstructorMobileHeader.tsx`

1. **Keep** the solid safe-area fill and the header bar as-is (solid primary background, not gradient — it's too small for a gradient to matter)
2. **Add** an absolutely-positioned pseudo-element or div **after** the header content that extends ~40-60px below the header and fades from `primary` to `transparent`
3. This overlay sits on top of page content, creating the graduated bleed effect

```tsx
<div className="sticky top-0 z-50">
  <div className="bg-primary pt-[env(safe-area-inset-top)]" />
  <div className="bg-primary text-primary-foreground relative overflow-hidden">
    <div className="relative flex items-center justify-between px-4 py-3">
      {/* ...existing header content... */}
    </div>
  </div>
  {/* Graduated fade below header */}
  <div
    className="h-12 -mb-12 pointer-events-none relative z-40"
    style={{
      background: 'linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.4) 40%, transparent 100%)'
    }}
  />
</div>
```

The `-mb-12` with `pointer-events-none` makes the gradient overlay the content below without pushing it down. This matches the VW reference where the dark color bleeds into the content area.

