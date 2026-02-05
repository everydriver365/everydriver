
# Add Tyre Track Design to Footer

## Overview
Add a decorative tyre track pattern to the footer, styled in the brand's navy blue color. The pattern will be created as an inline SVG for flexibility and color control, positioned as a subtle background element.

## Design Approach
- Create an SVG-based tyre track pattern inspired by the uploaded image
- Use `primary-foreground` with reduced opacity so it's visible on the navy blue footer background
- Position it as a decorative element on one side of the footer (similar to the reference image)
- Keep it subtle so it doesn't interfere with footer content readability

## Technical Implementation

### File: `src/components/layout/Footer.tsx`

**Changes:**
1. Add a decorative SVG tyre track pattern component
2. Position it absolutely on the right side of the footer
3. Use white color with low opacity (~10-15%) for subtlety
4. Make it responsive - hide or reduce on mobile for cleaner appearance

### SVG Pattern Design
The tyre track will be created as an inline SVG with:
- Chevron/arrow-shaped tread blocks arranged in a diagonal pattern
- Slight curve to give it a natural tyre appearance
- Rendered in `primary-foreground` (white) with opacity

### Layout Changes
```text
┌──────────────────────────────────────────────────────────┐
│  Footer (bg-primary = navy blue)                         │
│  ┌────────────────────────────────┐    ┌───────────────┐ │
│  │                                │    │   Tyre Track  │ │
│  │  Logo, Links, Contact info    │    │   Pattern SVG │ │
│  │  (existing content)           │    │   (decorative)│ │
│  │                                │    │               │ │
│  └────────────────────────────────┘    └───────────────┘ │
│  Copyright line                                          │
└──────────────────────────────────────────────────────────┘
```

## Responsive Behavior
- **Desktop**: Full tyre track visible on right side
- **Mobile**: Hidden or reduced opacity to maintain readability

## Visual Result
A subtle white tyre track pattern will appear on the right side of the navy blue footer, adding visual interest while maintaining the professional look and content legibility.
