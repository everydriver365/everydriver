

## Fix: Remove Grey Line at Bottom of Navigation

The grey line you're seeing at the bottom of the screen is caused by the **top border** on the bottom navigation bar. The nav has `border-t` applied, which renders a visible grey border line above the nav.

### What will change

In `src/components/instructor/InstructorBottomNav.tsx`, the border classes will be removed from the nav element:

- **Remove** `border-t` from the base classes
- **Remove** `border-border/30` (wallpaper mode) and `border-border/50` (default mode)
- Keep the shadow for subtle visual separation instead of a hard border line

This is a single-line change in the className of the `<nav>` element.

### Technical Details

**File**: `src/components/instructor/InstructorBottomNav.tsx` (line 133-135)

Current:
```
"fixed bottom-0 left-0 right-0 z-50 border-t shadow-[...] md:hidden",
wallpaperColor ? "border-border/30" : "bg-background/95 backdrop-blur-sm border-border/50"
```

Updated:
```
"fixed bottom-0 left-0 right-0 z-50 shadow-[...] md:hidden",
wallpaperColor ? "" : "bg-background/95 backdrop-blur-sm"
```

