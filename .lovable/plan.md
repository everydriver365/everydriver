

## Investigation: Background Color `#2596be`

### Current State
All section backgrounds across all mini-site pages **already have `#2596be`** applied via inline styles. The code is correct.

However, I found two remaining issues that could cause the page to appear unchanged:

1. **Loading states in `MiniWebsiteHome.tsx`** (lines 73, 84) still use `bg-background` (a light gray CSS class) instead of `#2596be`. When the page first loads, you see this gray background before data arrives.

2. **The instructor's `brand_colour` from the database may already be `#2596be`** (or very close). The hero section uses `primaryColor` (from `instructor.brand_colour`), which would make it visually identical to the new section backgrounds — so the change appears invisible because everything was already the same shade of blue.

### Plan
- Replace `bg-background` with `style={{ backgroundColor: '#2596be' }}` on the loading and not-found states in `MiniWebsiteHome.tsx` (lines 73 and 84) — matching the other pages which already have this fix.
- This is a minor fix; the main content sections are already correct.

If after this fix the color still appears unchanged, it's likely because the instructor's brand colour in the database is already `#2596be`, making the hero blend with the background.

