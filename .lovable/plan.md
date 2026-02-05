
# Add Tyre Track Design to Instructor Mobile Schedule View

## Overview
Add the same decorative tyre track SVG pattern (in the brand's navy blue) to the instructor mobile schedule view, providing visual consistency with the main footer.

## Implementation Approach

### File to Modify: `src/components/instructor/NewMobileScheduleView.tsx`

Since the instructor mobile layout uses a light gray (`#EDEDED`) background, the tyre track will use the **primary color (navy blue)** with low opacity to be visible against the light background.

### Changes

1. **Add TyreTrackPattern component** (same SVG as footer, but navy colored for light background)
2. **Wrap the main container** with `relative overflow-hidden`
3. **Position the pattern** absolutely on the right side
4. **Use `text-primary` with ~5-8% opacity** for subtle navy blue effect on light background

### Code Structure
```tsx
// Add at top of file
function TyreTrackPattern() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-32 md:w-48 opacity-[0.05] pointer-events-none text-primary"
      viewBox="0 0 200 600"
      preserveAspectRatio="xMaxYMid slice"
      fill="currentColor"
      ...
    >
      {/* Same chevron pattern as footer */}
    </svg>
  );
}

// Wrap outer div
<div className="relative space-y-4 overflow-hidden">
  <TyreTrackPattern />
  {/* existing content */}
</div>
```

### Visual Result
A subtle navy blue tyre track pattern will appear on the right edge of the schedule view, adding visual interest while maintaining readability of lesson cards and content.

---

## Technical Notes
| Aspect | Detail |
|--------|--------|
| File | `src/components/instructor/NewMobileScheduleView.tsx` |
| Pattern color | `text-primary` (navy blue) |
| Opacity | 5% for light background visibility |
| Position | Right side, full height |
| Responsive | Slightly smaller width on mobile |
