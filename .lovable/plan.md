# Improve SEO on winchesterdrivingschool.co.uk

## Why this matters

Today every whitelabel domain inherits the generic `EveryDriver | Find Driving Instructors…` title and description from `index.html`, has no `LocalBusiness` schema, no per-page meta, no whitelabel sitemap, and no geo targeting. Search engines see Winchester as a near-duplicate of Drive365 with no local signal — terrible for ranking on "driving lessons Winchester", "driving instructor Winchester", etc.

## What we'll change (frontend + a small edge function)

### 1. Dynamic, branded `<head>` per whitelabel host
Extend `SEOHead` (and call it on every public whitelabel page) so when `getWhitelabelConfig()` returns a config it overrides:
- `<title>` — e.g. *"Winchester Driving School — Driving Lessons & Intensive Courses in Winchester"*
- `<meta name="description">` — local, keyword-rich, instructor-name-aware (≤160 chars)
- `<meta name="keywords">` (light, area-based)
- `<meta name="geo.region">` `GB-HAM`, `<meta name="geo.placename">` Winchester, `<meta name="geo.position">` lat;lng (from instructor's `home_postcode` lookup we already have)
- Open Graph + Twitter card with the school's logo (`logoPath`) and brand name
- `<html lang="en-GB">`

Per-route titles already wired into pages get a `| {brandName}` suffix when whitelabelled (Courses, Book, Reviews, Contact, About).

### 2. JSON-LD structured data
Inject a `LocalBusiness` (subtype `DrivingSchool`) script tag from `SEOHead` on whitelabel hosts:
- name, url (canonical), logo, image, telephone, email, address (postcode + Winchester), `areaServed`, `priceRange`, `sameAs` (social links if present), `aggregateRating` (only if we have ≥1 review).
Add `BreadcrumbList` JSON-LD on `/courses`, `/book/...`, `/reviews`.
Add `Course`/`Offer` JSON-LD per visible course on `WhitelabelCourses` (name, provider, price, courseMode=onsite, location).
Add `FAQPage` JSON-LD if the home page renders FAQs.

### 3. Canonical + hreflang + robots
- `CustomDomainCanonical` already sets `rel=canonical`. Also add `<link rel="alternate" hreflang="en-GB">` and `x-default` to the same canonical.
- Update `public/robots.txt` to additionally list a whitelabel sitemap endpoint (see #4). Robots stays Allow-all.

### 4. Per-whitelabel sitemap
New edge function `whitelabel-sitemap` (`/functions/v1/whitelabel-sitemap?host=winchesterdrivingschool.co.uk`) that returns an XML sitemap of:
- `/`, `/courses`, `/reviews`, `/contact`, `/about`
- one URL per active course/lesson type for that instructor
- `lastmod` from the latest `courses.updated_at`
Also add a tiny static `/sitemap.xml` route (handled in `publicRoutes` via a redirect to the edge function with the current host) so `https://winchesterdrivingschool.co.uk/sitemap.xml` works directly. Reference it from `robots.txt` via the apex URL.

### 5. Content & on-page signals (Winchester home + courses)
On `Index` when whitelabelled, surface text Google can rank:
- H1 swaps to *"Driving Lessons in Winchester"* (currently generic).
- Add a short "Areas we cover" block (Winchester, Eastleigh, Alresford, Romsey, Twyford, Kings Worthy) — pulled from `instructor.location_name` or a new `service_areas` array we already store under `instructor_postcode_rules`/area cache.
- Add review snippets above the fold so the `aggregateRating` JSON-LD has visible support.
- Ensure all `<img>` have descriptive alt text including "Winchester driving instructor".

### 6. Performance & Core Web Vitals (cheap wins)
- Preload the brand logo and hero image with `<link rel="preload" as="image">` on whitelabel hosts.
- Add `loading="lazy"` + `decoding="async"` to below-the-fold images (audit `Index`, `WhitelabelCourses`).
- Add `width`/`height` to the hero `<img>` to stop CLS.

### 7. Social/share polish
- `og:image` defaults to the brand logo on a 1200×630 backdrop generated at build (one PNG per active whitelabel — start with Winchester only).
- `og:locale` `en_GB`.

## Out of scope
- No backend role changes, no payment changes.
- No new RLS or schema beyond reading existing fields.
- Mobile-only layouts untouched (per project rule).

## Technical notes
- `SEOHead` becomes async-aware of `getWhitelabelConfig()` and re-runs on route change.
- Geo coords resolved once via existing postcode → lat/lng helper (`src/lib/postcode.ts` or area cache); cached in `whitelabel.ts`.
- New edge function lives in `supabase/functions/whitelabel-sitemap/index.ts` with `verify_jwt = false` (public).
- All structured data injected as `<script type="application/ld+json">` and torn down on unmount to avoid duplicates across navigations.

## Verification
1. View source on `https://winchesterdrivingschool.co.uk/` → title, description, OG, JSON-LD all reference Winchester.
2. `curl https://winchesterdrivingschool.co.uk/sitemap.xml` returns Winchester URLs.
3. Google Rich Results Test passes for `LocalBusiness` and `Course`.
4. Lighthouse SEO ≥ 95 on home and `/courses`.
5. Toggling Kenneth's visibility off keeps the "Bookings paused" page indexed but with `noindex` meta added (so paused pages don't outrank live ones).
