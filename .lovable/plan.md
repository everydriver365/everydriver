

## Graduated Header Design for Instructor Mobile App

### Reference
The VW screenshot shows a dark header area that graduates/fades into the content below — a smooth gradient from a solid dark color at the top (covering the safe area/status bar) into a lighter or transparent zone beneath.

### What we'll do
Update `InstructorMobileHeader.tsx` to replace the flat `bg-primary/85` background with a **vertical gradient** that starts fully opaque at the top (safe area) and graduates to a slightly lighter/more transparent primary at the bottom edge. This creates the same premium graduated effect.

### Technical change

**`src/components/instructor/InstructorMobileHeader.tsx`** (lines 76-77)

Replace the current flat background with a gradient approach:
- The outer sticky wrapper gets a solid `bg-primary` for the safe area inset
- The header bar itself uses a CSS gradient: from `primary` (100% opacity) at top → `primary/75` at bottom
- This creates the graduated fade effect while keeping existing colors
- Remove the backdrop-blur since the gradient itself provides the visual depth

```
<div className="sticky top-0 z-50">
  {/* Safe area fill — solid primary */}
  <div className="bg-primary pt-[env(safe-area-inset-top)]" />
  {/* Header with graduated fade */}
  <div
    className="text-primary-foreground relative overflow-hidden"
    style={{
      background: 'linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 60%, hsl(var(--primary) / 0.7) 100%)'
    }}
  >
    <div className="relative flex items-center ...">
```

Single file change, preserves all existing functionality and colors.

