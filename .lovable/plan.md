

# Fix: Extend Header Blue Into Top Safe Area on Mobile

## Problem
On a mobile phone, there's a visible white gap above the blue header. This is caused by the iOS safe area inset (the notch/status bar region) showing the white page background behind the header.

## Solution
Add a top safe area fill to the header element so the primary navy color extends all the way to the very top of the screen, covering the notch/status bar area.

## Changes

**File: `src/components/layout/InstructorPortalLayout.tsx`** (line 313-314)

Add `bg-primary` to the `<header>` wrapper so the safe area above the inner gradient div is also blue, and add top padding for the safe area inset:

```
<header className="sticky top-0 z-40 bg-primary" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
```

This single-line change ensures:
- The safe area behind the notch/status bar is filled with the primary navy
- The existing header content remains unchanged
- No impact on non-notched devices (the env() value is 0 on those)
