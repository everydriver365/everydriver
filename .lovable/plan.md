

## Plan: Auto-fill and Auto-search Postcode on Mini-Website Courses Page

### Problem
When a user enters a postcode on the mini-site hero and clicks search, they navigate to `/i/{slug}/courses?postcode=XX`. The postcode query param is already passed in the URL (line 250 of `MiniWebsiteHome.tsx`), but `MiniWebsiteCourses.tsx` never reads it — so the postcode field is empty and requires re-entry.

### Changes

**1. `src/pages/mini-website/MiniWebsiteCourses.tsx`**
- Read the `postcode` query parameter from the URL using `useSearchParams` or `useLocation`
- On mount, if a `postcode` param exists, call `setPostcode(postcode)` and trigger `handleSearch()` automatically

**2. `src/hooks/useCourseDiscovery.ts`**
- Add an optional `initialPostcode` parameter to the hook
- If provided, initialize the postcode state with it and auto-trigger search on first load (via a `useEffect`)

This is a small, two-file change. The postcode will be pre-filled and the search will run automatically when arriving from the hero section.

