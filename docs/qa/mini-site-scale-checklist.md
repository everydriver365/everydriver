# Mini-Site Scale Checklist — 6,000 Instructors

Phase 1 hardening for the instructor mini-site product. Each item below is verifiable via DB query, browser test, or admin UI.

## Reliability
- [ ] Every active instructor has all 5 `instructor_website_pages` rows
  - SQL: `SELECT instructor_id FROM instructors i WHERE is_active AND (SELECT count(*) FROM instructor_website_pages WHERE instructor_id = i.id AND is_published) < 5;`
  - Backfill migration runs on every signup (trigger) and was applied retroactively.
- [ ] Every mini-site read uses `.maybeSingle()` not `.single()`
- [ ] `useWebsitePage` synthesises a fallback page if the row is missing
- [ ] `loadBrandConfig` returns null gracefully (never throws) for unbranded hosts

## Whitelabel routing
- [ ] `ConditionalRoutes` never renders `MiniWebsite*` on a custom domain
- [ ] `/services` on whitelabel renders `<Courses />`, never `null`
- [ ] `/about`, `/contact`, `/reviews`, `/courses` read `getWhitelabelConfig()` and scope queries to the resolved instructor

## Scale infrastructure
- [ ] Indexes present:
  - `idx_instructors_app_slug` (unique partial)
  - `idx_instructors_custom_domain_verified` (unique partial)
  - `idx_iwp_instructor_pagetype`
  - `idx_iwp_instructor_published`
- [ ] `resolve-host` edge function deployed; `BrandProvider` calls it first, DB fallback on timeout
- [ ] Sitemap split:
  - `/functions/v1/mini-website-sitemap-index` returns sitemapindex
  - `/functions/v1/mini-website-sitemap?page=N` returns ≤5,000 URLs
  - Submit `mini-website-sitemap-index` to Google Search Console
- [ ] `robots.txt` should reference the sitemap index (not the legacy single sitemap)

## Health monitoring
- [ ] `mini-site-health-check` cron runs daily at 03:15 UTC
- [ ] `mini_site_health` table has one row per active instructor after first run
- [ ] `AdminWebsiteManager` shows green/amber/red badge from latest run
- [ ] Admins can filter "show only red" / "show only amber"

## Manual smoke tests
1. Visit `https://winchesterdrivingschool.co.uk/services` → renders Courses, not 404, not blank.
2. Visit `https://{older-instructor-slug}.drive365.co.uk/about` → renders About content (synthesised if no DB row).
3. Visit `https://{slug}.drive365.co.uk/i/{slug}` → mini-site renders end-to-end.
4. `curl https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/resolve-host?host=winchesterdrivingschool.co.uk` → returns branding payload.
5. Trigger health check manually: `curl -X POST .../functions/v1/mini-site-health-check` → completes, populates `mini_site_health`.
