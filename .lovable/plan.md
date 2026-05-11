# Mini-Website Reliability Audit & Stabilisation

You're right — the mini-website surface has too many failure modes. I traced the actual code paths for whitelabel domains (e.g. winchesterdrivingschool.co.uk → Ken D / `ken-d`) and `/i/{slug}` subdomain sites, and the unreliability falls into four root causes. Plan below fixes each one without redesigning the product.

## What's actually broken

### 1. Whitelabel domains still leak into the mini-site product
`ConditionalRoutes.tsx` was partly fixed (Contact, Reviews) but two routes still misbehave on whitelabel:
- **`/services`** → returns `null` → blank page / 404-feel
- **`/about`** → only checks subdomain; on whitelabel falls through to `<About />`. Need to confirm `<About />` (and `<Contact />`, `<Index />`, `<Reviews />`) actually re-scopes to the whitelabel instructor instead of showing platform-wide content (e.g. all instructors in directory, generic Drive365 contact details).

### 2. /i/{slug} pages 404 because seeded pages are missing
`useWebsitePage` filters on `is_published=true` AND uses `.single()` (not `.maybeSingle()`) — any missing row throws and the page flips to `notFound`. Pages are only seeded by the `create_instructor_website_pages` trigger on instructor INSERT. Any instructor who pre-dates the trigger, or whose seed row was unpublished/deleted, gets a hard 404 across About/Services/Reviews/Contact. Today Ken D happens to have all 5 — but most older instructors will not.

### 3. Wrong instructor shown on whitelabel
On a whitelabel domain, the standard Drive365 pages (`Index`, `About`, `Contact`, the new `Reviews`) need to read `getWhitelabelConfig()` and scope every list/query to that one instructor. If they don't, Winchester visitors see the entire Drive365 directory or generic content. Needs a sweep.

### 4. Mini-site pages crash on missing data
`useWebsitePage` uses `.single()` and the components throw if `instructor.business_name` etc. are null. Causes the "totally unreliable" feel — works for one instructor, blank/error for the next.

## Plan

### A. Make `ConditionalRoutes` fully whitelabel-safe
- `ConditionalServices` on whitelabel → render the rebranded Drive365 services/courses page (or redirect to `/courses` if that's the canonical), never `null`.
- `ConditionalAbout` on whitelabel → render `<About />`, but verify `About.tsx` reads `getWhitelabelConfig()` for instructor scope.
- Document the rule at the top of the file: **whitelabel never renders `MiniWebsite*` components**.

### B. Audit the four standard pages for whitelabel scoping
Sweep `Index.tsx`, `About.tsx`, `Contact.tsx`, `Reviews.tsx`, and `Courses.tsx`. For each:
- Read `getWhitelabelConfig()` early.
- If present, scope every Supabase query (`public_instructors`, `course_listings`, `course_reviews`, etc.) to `instructorSlug`.
- Replace any "all instructors" UI (directory grids, instructor pickers) with the single branded instructor.
- Use whitelabel `phone`/`email`/`address`/`brandName` in headers, contact CTAs, and footers.

Deliverable: short checklist in `docs/qa/whitelabel-page-scoping.md`.

### C. Self-heal seeded website pages
Two-part fix so /i/{slug} stops 404-ing for older instructors:
1. **Migration** — run `create_instructor_website_pages` logic for every existing instructor that's missing one or more of the five `page_type` rows, with `ON CONFLICT DO NOTHING`. One-time backfill.
2. **Defensive read** — change `useWebsitePage` to:
   - `.maybeSingle()` instead of `.single()`
   - Drop the `.eq("is_published", true)` filter, or fall back to a synthesised default page when the row is missing/unpublished, so a missing/unpublished page shows the seeded content instead of 404.

### D. Harden mini-site components
- All `instructor.business_name || instructor.name || "Driving School"` style fallbacks centralised in one helper.
- Loading skeletons everywhere `loading` is true (no blank flashes).
- A single `<MiniWebsiteNotFound />` component for the genuinely-missing case (instructor row truly absent), with a link back to Drive365 so users aren't stranded.

### E. Admin diagnostics
Add a "Mini-website health" badge to `AdminWebsiteManager` showing, for the selected instructor:
- `app_slug` set ✓/✗
- All 5 `instructor_website_pages` rows present and published ✓/✗
- `custom_domain` set + `custom_domain_verified` ✓/✗
- Logo + brand colour set ✓/✗
- Direct test links: `/i/{slug}`, `{slug}.everydriver.co.uk`, custom domain

So you can see at a glance which instructors are mis-configured before they complain.

### Out of scope
- No redesign of the mini-site visual product
- No changes to `mini-website-ssr` edge function
- No mobile layout changes
- No DB schema changes beyond the one-time backfill insert

## Files affected (estimate)
- `src/components/ConditionalRoutes.tsx`
- `src/pages/Index.tsx`, `About.tsx`, `Contact.tsx`, `Reviews.tsx`, `Courses.tsx` (scoping audit; minimal targeted edits)
- `src/hooks/useInstructorWebsitePages.ts` (defensive read)
- `src/pages/mini-website/MiniWebsite*.tsx` (skeletons + fallbacks, light touch)
- `src/components/admin/AdminWebsiteManager.tsx` (health badge)
- New: `docs/qa/whitelabel-page-scoping.md`
- One Supabase migration (backfill missing `instructor_website_pages` rows)

Approve and I'll execute A–E in that order, pausing after the migration for you to verify.
