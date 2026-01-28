
# Change Global Navigation Color to #06174C

## Summary

You want to update the header, top navigation, and bottom navigation across all pages from the current blue (#0b4089) to a darker navy blue (#06174C). Since these components use Tailwind's `bg-primary` class, the most efficient approach is to update the CSS custom property that defines the primary color.

## What Will Change

Updating the `--primary` CSS variable will affect all elements using `bg-primary`, including:
- **Public site header** (Header.tsx)
- **Public site footer** (Footer.tsx)  
- **Public site mobile bottom nav** (MobileBottomNav.tsx)
- **Mobile homepage header** (MobileHomepage.tsx)
- **Instructor portal header** (InstructorPortalLayout.tsx)
- **Instructor bottom nav** (InstructorBottomNav.tsx)
- **Tracking pages headers** (InstructorTraccarSession.tsx, InstructorTraccarSetup.tsx)
- **Primary buttons** across the site
- **Login pages** (instructor, pupil, admin)

## Implementation

### Single File Change

**File:** `src/index.css`

Update line 16:
```css
/* Before */
--primary: 212 85% 29%;

/* After - #06174C converted to HSL */
--primary: 226 85% 16%;
```

### Color Conversion Details

| Property | Old Value | New Value |
|----------|-----------|-----------|
| Hex | #0b4089 | #06174C |
| HSL | 212 85% 29% | 226 85% 16% |
| Appearance | Medium blue | Darker navy blue |

## Visual Impact

The new color is noticeably darker than the current blue. All navigation bars, headers, footers, primary buttons, and active states will shift to this deeper navy tone.

No additional file changes are required since all navigation components already use the `bg-primary` Tailwind class, which references this CSS variable.
