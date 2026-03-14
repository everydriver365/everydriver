

## Match iPhone Safe Area Color to Header

### Problem
The `InstructorMobileHeader` component (used on the Notifications page) doesn't fill the iOS safe area inset with the header color. The status bar area shows the default background instead of matching the header's `bg-primary/85`.

### Fix
**File: `src/components/instructor/InstructorMobileHeader.tsx`** (line 77)

Add `pt-[env(safe-area-inset-top)]` to the header's backdrop container so the translucent primary color extends into the iOS status bar area:

```tsx
// Before
<div className="backdrop-blur-xl backdrop-saturate-150 bg-primary/85 text-primary-foreground relative overflow-hidden">

// After
<div className="backdrop-blur-xl backdrop-saturate-150 bg-primary/85 text-primary-foreground relative overflow-hidden pt-[env(safe-area-inset-top)]">
```

This matches the pattern already used in `InstructorPortalLayout.tsx` (line 413). Single line change.

