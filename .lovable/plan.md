

## SEO on Mini-Websites — Current State and Plan

### Current State
- **No SEO meta tags** are set on any mini-website page (Home, About, Services, Courses, Reviews, Contact, Tests, Theory).
- The `SEOHead` component exists but pulls from a global `site_settings` table — not instructor-specific data.
- The `MiniWebsiteLayout` does not set `document.title` or any meta tags.
- No structured data (JSON-LD) exists for instructors.
- `robots.txt` allows all crawlers globally, which is fine.

### Plan

**1. Add dynamic SEO meta tags per mini-website page**

Update `MiniWebsiteLayout` to set base SEO tags using instructor data:
- `document.title` → "{Instructor Name} | {Page} | Drive365"
- `meta[description]` → auto-generated from instructor bio/business name/location
- `og:title`, `og:description`, `og:image` (use instructor logo or profile image)
- `twitter:card` tags

Each page component (Home, About, Services, etc.) will pass a `pageTitle` and optional `pageDescription` prop to the layout, which handles the meta injection via a new `useMiniWebsiteSEO` hook.

**2. Create `useMiniWebsiteSEO` hook**

A lightweight hook that accepts instructor data + page name and sets all relevant meta tags in a `useEffect`, similar to the existing `SEOHead` pattern but instructor-scoped:
- Title: `{Business Name} - {Page} | Drive365`
- Description: derived from instructor bio, service area, or page-specific content
- OG image: instructor profile image or logo
- Canonical URL: using the `/i/:slug` or subdomain URL

**3. Add JSON-LD structured data for LocalBusiness**

Inject a `<script type="application/ld+json">` in the layout with:
- `@type: LocalBusiness` (or `DrivingSchool` if using extended schema)
- name, description, telephone, email, address (from postcode), image, url
- This helps Google surface instructor sites in local search results

**4. Add canonical URLs**

Set `<link rel="canonical">` to prevent duplicate content between subdomain and path-based URLs (e.g., `jane-smith.everydriver.co.uk` vs `everydriver.co.uk/i/jane-smith`).

### Files to create/modify
- **Create**: `src/hooks/useMiniWebsiteSEO.ts` — meta tag + JSON-LD injection hook
- **Modify**: `src/components/mini-website/MiniWebsiteLayout.tsx` — call the hook, accept page title prop
- **Modify**: Each mini-website page (Home, About, Services, Courses, Reviews, Contact, Tests) — pass page-specific title/description to layout

### No database changes required
All data needed (name, bio, phone, email, postcode, logo, profile image) already exists on the `public_instructors` view.

