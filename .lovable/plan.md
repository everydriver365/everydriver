## What's happening

**Featured Courses** are vanishing because of the new network-placeholder seed (5,796 placeholder instructors). `useFeaturedCourses` queries `public_instructors` with only `is_active=true`, so it pulls back ~5,800 rows — PostgREST caps at the first 1,000, which are almost entirely placeholders. Placeholders have no `instructor_working_hours`, so `findFirstAvailableDate()` returns `null` for every one of them and the loop produces zero courses → the section renders the "No courses available at the moment" empty state.

This directly violates the project rule in `mem://constraints/network-placeholder-instructors` ("every admin list/count query MUST chain `.eq('is_network_placeholder', false)`") — and the same rule applies here because the homepage Featured Courses is a curated/featured surface, not the public search index.

DB check confirms: `public_instructors WHERE is_active=true` returns 5,800; with `is_network_placeholder=false` it returns just 4 (the real instructors).

**News & Tips**: the `fetch-dvsa-news` edge function is healthy (verified live, returns `success:true` with items). The desktop and mobile news sections in `src/pages/Index.tsx` are wired to `useDVSANews()` and conditionally render only when `dvsaNews.length > 0` (otherwise `null`). If the section is missing for you, it is almost certainly because the request was momentarily slow / cached as empty in a previous load — not a code bug. I'll add a small fallback so the section keeps its heading + "View all articles" link even when the fetch is empty, so it never silently disappears.

## Changes

1. **`src/hooks/useFeaturedCourses.ts`** — add `.eq("is_network_placeholder", false)` to the `public_instructors` query (and keep all other filters). This restores the 4 real instructors at the front of the list and makes Featured Courses populate again.

2. **`src/pages/Index.tsx`** (News & Tips desktop + mobile sections) — instead of returning `null` when `dvsaNews.length === 0`, render a short empty state ("Latest articles coming soon") so the section heading and "View all articles" link remain visible. Pure presentation, no business-logic change.

No other files, no schema/RLS changes, no edge-function changes.

## Verification

- Reload `/drive365`: Featured Courses grid shows 3 cards from the 4 real instructors (sorted by soonest available date).
- News & Tips section header is always visible; cards appear as soon as `fetch-dvsa-news` resolves.
