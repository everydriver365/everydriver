

## Problem

Several links within the instructor mini-site navigate away from the `/i/{slug}/...` scope:

1. **`/benefits`** — Earlier Test Guarantee CTA on the home page links to `/benefits` (a top-level route, not within the mini-site)
2. **`/book/{instructor.id}`** — "Book Now" CTAs on About, Services, Reviews, and Contact pages link to a top-level booking page outside the mini-site
3. **`Link to="/"`** — "Go Home" buttons in error/not-found states on all 6 mini-website pages link to the root `/` instead of back to `/i/{slug}`
4. **Footer "Powered by" link** — Points to `/i/{instructor.app_slug}` which is fine (stays in mini-site)
5. **Social media links** (Facebook, Instagram, etc.) — These are genuine external links (`target="_blank"`) to the instructor's own social profiles; these should remain as-is since they open in new tabs
6. **`MiniWebsiteSecondaryNav`** — Links to `/i/{slug}/theory`, `/i/{slug}/tests`, `/i/{slug}/contact` — these are fine

## Plan

### 1. Fix `/benefits` link → `/i/{slug}/benefits` or inline section
**File:** `src/pages/mini-website/MiniWebsiteHome.tsx`
- Change `<Link to="/benefits">` to `<Link to={links.getPageLink("benefits")}>`  
- Or, if there's no `/i/{slug}/benefits` route, link to `/i/{slug}/courses` or `/i/{slug}/contact` instead as the most relevant in-site alternative

### 2. Fix `/book/{id}` links → `/i/{slug}/contact`
**Files:** `MiniWebsiteAbout.tsx`, `MiniWebsiteServices.tsx`, `MiniWebsiteReviews.tsx`, `MiniWebsiteContact.tsx`
- Replace all `<Link to={'/book/${instructor.id}'}}>` with `<Link to={'/i/${slug}/contact'}>` (or use `links.contact` where available) to keep users on the mini-site's contact/enquiry page

### 3. Fix `Link to="/"` error states → `/i/{slug}`
**Files:** All 6 mini-website page files (`MiniWebsiteHome.tsx`, `MiniWebsiteAbout.tsx`, `MiniWebsiteServices.tsx`, `MiniWebsiteCourses.tsx`, `MiniWebsiteReviews.tsx`, `MiniWebsiteContact.tsx`)
- Change `<Link to="/">` to `<Link to={'/i/${slug}'}}>` so "Go Home" returns to the instructor's mini-site homepage

### Summary of changes
- ~10 link updates across 6-7 files
- No new routes or components needed
- Social media external links (open in new tab) left unchanged

