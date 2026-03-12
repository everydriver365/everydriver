

## Plan: Fix Internal Links on Ken D Mini-Website Homepage

### Issues Found

1. **Search form** (line 185): Uses `window.location.href` causing a full page reload instead of SPA navigation. The path `/i/${slug}/courses` is correct but should use React Router's `navigate()`.

2. **Footer "Powered by" link** (line 268 in `MiniWebsiteLayout.tsx`): `<a href="/">` navigates to the main site root, leaving the mini-site. Should link back to `/i/${slug}`.

3. **"Everything You Need" section** (lines 448-476): Contains tiles referencing main platform features (Parent Portal, Theory Support, Local Instructors, etc.) that either have no links or conceptually point outside the mini-site. These should all link to relevant mini-site pages.

### Changes

**`src/pages/mini-website/MiniWebsiteHome.tsx`**
- Replace `window.location.href = /i/${slug}/courses...` with `navigate()` from React Router (already imported `useNavigate` or add it)
- Update the "Everything You Need" section tiles to all use `links.*` destinations:
  - "Search, Compare & Book" → `links.courses` (already correct)
  - "Parent Portal" → `links.contact`
  - "Live Availability" → `links.courses`
  - "Local Instructors" → `links.about`
  - "Track Progress" → `links.courses`
  - "Theory Support" → `links.courses`

**`src/components/mini-website/MiniWebsiteLayout.tsx`**
- Change the footer "Powered by EveryDriver" link from `href="/"` to a React Router `<Link to={/i/${slug}}>` so it stays within the mini-site

### No database changes needed.

