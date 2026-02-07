

# Fix Hero Image to Be Truly Edge-to-Edge

## Problem
The `InstructorPortalLayout` wraps all page content in `<main className="px-4 py-4">` (line 500 of `InstructorPortalLayout.tsx`). The current approach uses negative margins (`-mx-4 -mt-4`) on the home page to counteract this, which is fragile and can cause overflow issues or not work perfectly across all screen sizes.

## Solution
Conditionally remove the padding from the layout's `<main>` tag when on the home page (`/instructor`), and remove the negative margin hack from `InstructorMobileHome.tsx`.

## Changes

### 1. InstructorPortalLayout.tsx (line ~500)
- Detect when we're on the `/instructor` route (exact match)
- When on home page: render `<main>` without `px-4 py-4` so the hero can be truly full-bleed
- All other pages keep `px-4 py-4` as before

### 2. InstructorMobileHome.tsx (line ~287)
- Remove the `-mx-4 -mt-4` negative margin hack from the root container since the layout will no longer add padding on the home page

### 3. ContextualHomeHero.tsx (line ~176)
- The overlapping card currently has `mx-4` which is correct -- it keeps the card inset from the edges while the hero image behind it goes full width. No change needed here.

## Result
The hero image will render truly edge-to-edge (no padding from the parent layout), matching the reference image style. The overlapping card stays inset with its own `mx-4`. All other pages remain unaffected.

