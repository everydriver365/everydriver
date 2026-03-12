

## Plan: Make #17A9FD Background Visible Across Mini-Site

### Problem
The `#17A9FD` background was applied to the layout wrapper, but every content section on each page uses opaque backgrounds (`bg-background`, `bg-muted/30`, `bg-card`, `bg-gray-50`, etc.) that completely cover it. The blue is never visible.

### Approach
Rather than making sections transparent (which would hurt readability), the correct approach is to apply `#17A9FD` as the background on each content section that currently uses neutral backgrounds. Cards and interactive elements will keep their existing styling for contrast.

### Files to Change

**`src/pages/mini-website/MiniWebsiteHome.tsx`**
- Replace `bg-background` on the hero section, "What's Included" section, and "Everything You Need" section with inline `style={{ backgroundColor: '#17A9FD' }}`
- Replace `bg-muted/30` on "Choose Your Learning Path" section similarly
- Keep `bg-card` on cards for contrast/readability

**`src/pages/mini-website/MiniWebsiteAbout.tsx`**
- Replace `bg-gray-50` backgrounds on content sections with `#17A9FD`

**`src/pages/mini-website/MiniWebsiteContact.tsx`**
- Replace `bg-gray-50` backgrounds on content sections with `#17A9FD`

**`src/pages/mini-website/MiniWebsiteReviews.tsx`**
- Replace `bg-gray-50` backgrounds on content sections with `#17A9FD`

**`src/pages/mini-website/MiniWebsiteCourses.tsx`**
- Replace any `bg-background`/`bg-gray-50` section backgrounds with `#17A9FD`

**`src/pages/mini-website/MiniWebsiteServices.tsx`** (if exists)
- Same treatment

**`src/components/mini-website/MiniWebsiteLayout.tsx`**
- Already has `#17A9FD` on the wrapper — keep as fallback

### No database changes needed.

