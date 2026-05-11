
# Mini-Site Platform: Scale to 6,000 Instructors

Three phases, run in order. Each phase ships independently and leaves the system better than it found it. Approve and I'll execute Phase 1 first, pause for you to verify, then Phase 2, then Phase 3.

---

## Phase 1 — Reliability & Scale to 6,000

Goal: zero unreliable mini-sites today, infrastructure that survives 6,000 of them tomorrow.

### 1.1 Database indexes (migration)
- Unique partial index on `instructors.custom_domain` where `custom_domain_verified = true`.
- Index on `instructors.app_slug` (unique).
- Index on `instructor_website_pages (instructor_id, page_type)`.
- Index on `instructor_website_pages (instructor_id) where is_published = true`.

### 1.2 Backfill missing seeded pages (migration)
One-time `INSERT … SELECT … ON CONFLICT DO NOTHING` so every existing instructor has all 5 page rows. Batch in chunks of 500 to avoid long locks.

### 1.3 Defensive reads everywhere
- `useWebsitePage` already moved to `.maybeSingle()` with synthesised fallback — keep.
- Sweep every other mini-site hook (`useMiniWebsiteSEO`, `useMiniWebsiteLinks`, `useInstructorWebsitePages`, `useInstructorBranding`, `useDomainBranding`) for `.single()` → `.maybeSingle()` and add fallbacks. Centralise instructor display-name fallback in one helper.

### 1.4 Whitelabel routing audit (finish what was started)
- `ConditionalRoutes.tsx`: confirm `/services` and `/about` never return `null` or fall through to mini-site components on whitelabel.
- Sweep `Index.tsx`, `About.tsx`, `Contact.tsx`, `Reviews.tsx`, `Courses.tsx`: each must read `getWhitelabelConfig()` early and scope every Supabase query to `instructorSlug`. No platform-wide directory leakage.
- Document the rule at top of `ConditionalRoutes.tsx`: **whitelabel hosts NEVER render `MiniWebsite*` components**.

### 1.5 Sitemap pagination
Replace single `mini-website-sitemap` (would be ~36k URLs at 6,000 instructors, over Google's 50k/file limit) with:
- `mini-website-sitemap-index` → returns `<sitemapindex>` listing N child sitemaps.
- `mini-website-sitemap?page=N` → returns up to 5,000 URLs (1,000 instructors × 5 pages) per page.
- Both cached at edge (`Cache-Control: public, max-age=86400, s-maxage=86400`).

### 1.6 Host→instructor edge cache
`loadBrandConfig` runs on every cold load and hits `public_instructors`. At 6,000 sites with traffic, this is the hot path.
- New edge function `resolve-host` with in-memory + KV-style cache (Deno Map keyed by host, 5-min TTL) returning `{ slug, brandName, logoUrl, brandColour, phone, email, address }`.
- `BrandProvider` calls this once per cold load. Falls back to direct DB query if the function is down.
- Invalidated when admin updates `instructors.custom_domain` or branding fields (small RPC to bump cache version).

### 1.7 Health monitoring
- New cron job (daily) `mini-site-health-check`: for every active instructor, verify (a) all 5 page rows present + published, (b) `app_slug` set, (c) if `custom_domain` set, DNS resolves to Lovable IP and SSL cert valid, (d) `/i/{slug}` returns 200.
- Writes results to a new `mini_site_health` table (instructor_id, checked_at, dns_ok, ssl_ok, pages_ok, render_ok, notes).
- `AdminWebsiteManager` shows a red/amber/green badge per instructor sourced from this table. Filter "show only failing".

### 1.8 Admin pagination
`AdminWebsiteManager` currently loads all instructors. Add server-side pagination + search by name/slug/domain. Required at 6,000 rows.

### Deliverables — Phase 1
- 2 migrations (indexes; backfill)
- Updated hooks: defensive reads
- Updated `ConditionalRoutes.tsx` + 5 standard pages: whitelabel scoping
- 2 new edge functions: `resolve-host`, `mini-website-sitemap-index`; updated `mini-website-sitemap`
- 1 new edge function + cron: `mini-site-health-check` + `mini_site_health` table
- Updated `AdminWebsiteManager`: health badges, pagination, search
- Doc: `docs/qa/mini-site-scale-checklist.md`

---

## Phase 2 — Per-Instructor SEO + Content Editor

Goal: every instructor can edit their site's copy, images, and SEO so each of the 6,000 sites is genuinely unique (no duplicate-content SEO penalty, real ranking power).

### 2.1 Schema additions (migration)
Extend `instructor_website_pages`:
- `og_image_url text`
- `canonical_url text` (auto-set to instructor's primary host on save)
- `keywords text[]`
- `schema_jsonld jsonb` (auto-generated LocalBusiness + Service schema, editable)
- `last_edited_at timestamptz`, `last_edited_by uuid`

Add `instructor_website_settings` table (1:1 with instructor):
- `default_og_image_url`, `favicon_url`, `google_analytics_id`, `google_site_verification`, `bing_site_verification`, `robots_index boolean default true`.

### 2.2 New "My Website" tab in instructor portal
Route: `/instructor-app/website` — split-pane editor, mobile-aware:
- **Left**: page tree (Home, About, Services, Reviews, Contact) + global settings.
- **Right**: per-page editor with sections:
  - **Hero** — heading, subheading, image upload, CTA text/link.
  - **Content blocks** — drag-reorder list of blocks (text, features, image, gallery). Existing `ContentBlock` schema reused, just edited via UI instead of DB-only.
  - **SEO** — meta title (with character count + Google preview), meta description (char count + preview), OG image upload (with preview), keywords, canonical override, JSON-LD preview.
- **Live preview** button → opens `/i/{slug}/{page}?preview=draft` in new tab.
- **Publish** toggle per page.
- **Autosave drafts** to `instructor_website_pages` with a `draft_content` jsonb column; "Publish" copies draft → live fields.

### 2.3 Global settings panel
Logo, favicon, OG image, brand colour, business name, phone, email, address, area covered, social links, GA ID, verification tokens, robots.

### 2.4 SEO rendering
- `SEOHead.tsx` already exists — extend to read per-page `meta_title`, `meta_description`, `og_image_url`, `canonical_url`, `schema_jsonld`.
- Each branded site outputs its own `canonical` pointing at its own host (custom domain when verified, else subdomain).
- `mini-website-ssr` edge function (don't restructure it, just feed it the new fields) renders meta tags server-side for crawlers.

### 2.5 SEO health helper
In the editor, show a per-page SEO score:
- Title 30–60 chars ✓
- Description 120–160 chars ✓
- OG image set ✓
- At least 300 words of unique body copy ✓
- H1 present ✓
- Canonical set ✓
Amber badges nudge instructors to fix weak pages.

### 2.6 Image uploads
Reuse `instructor-images` storage bucket. New helper `useWebsiteImageUpload` — drag-drop, auto-resize to 1600px max width, WebP conversion on upload via edge function.

### Deliverables — Phase 2
- 1 migration (page fields + settings table + draft column)
- New page: `src/pages/instructor/Website.tsx` + components (`PageEditor`, `HeroEditor`, `BlockEditor`, `SEOEditor`, `GlobalSettingsEditor`, `SEOScoreCard`)
- Updated `SEOHead.tsx` + `mini-website-ssr` edge function
- New edge function: `image-optimize` (WebP + resize on upload)
- Reuses existing `instructor-images` bucket

---

## Phase 3 — Self-Serve Custom Domain Onboarding

Goal: instructors add their own domain, follow on-screen DNS instructions, system verifies + provisions SSL automatically. You stop being the bottleneck for 6,000 URL pointings.

### 3.1 Schema (migration)
Extend `instructors`:
- `custom_domain_verification_token text` (random per instructor)
- `custom_domain_dns_status text` ('pending' | 'verifying' | 'verified' | 'failed')
- `custom_domain_ssl_status text` ('pending' | 'issued' | 'failed')
- `custom_domain_last_checked_at timestamptz`
- `custom_domain_added_at timestamptz`

### 3.2 Domain onboarding wizard (in "My Website" → Domain tab)
4-step flow:
1. **Enter domain** — instructor types `mydrivingschool.co.uk`. Validate format, check uniqueness across instructors.
2. **Show DNS records** — copy-buttons next to each:
   - `A` record `@` → Lovable IP `185.158.133.1`
   - `A` record `www` → `185.158.133.1`
   - `TXT` record `_lovable` → unique verification token
   - Provider-specific guides (GoDaddy, 20i, Cloudflare, Namecheap, IONOS) collapsible.
3. **Verify** — "Check now" button calls `verify-custom-domain` edge function (also auto-polls every 30s for 10 min). Function does `dig TXT _lovable.{domain}` + `dig A {domain}` and `dig A www.{domain}`. Updates `custom_domain_dns_status`.
4. **Done** — once verified, sets `custom_domain_verified = true`, kicks off SSL via Lovable's existing custom-domain pipeline (the project already supports custom domains at platform level — this just automates the data side; the actual cert issuance still goes through Lovable's existing flow which currently you trigger by adding the domain in Project Settings).

Honest note: Lovable issues SSL via its own custom-domain feature in **Project Settings → Domains**. The wizard can fully automate DNS verification and the `instructors.custom_domain` data, but the **final step of registering the domain with Lovable's edge for SSL** still requires it to be added in Project Settings → Domains. Two options:
- **3a (manual SSL trigger):** wizard verifies DNS, marks domain ready, sends you a notification listing domains to add in Project Settings → Domains. Saves 95% of the work.
- **3b (fully automated):** requires Lovable to expose a custom-domain API (not currently public). If/when that lands, swap the manual step out without changing the user-facing wizard.

Default: ship 3a now. Document path to 3b.

### 3.3 Domain status dashboard
In "My Website" → Domain tab, show live status: DNS ✓/✗, SSL ✓/✗, last checked, "Recheck" button. Same data feeds the admin health badge from Phase 1.

### 3.4 Background re-verification
Daily cron (folded into `mini-site-health-check` from Phase 1) re-resolves DNS for every verified custom domain. If DNS drifts (instructor changes nameservers), flips `custom_domain_verified = false` and emails instructor + admin.

### 3.5 Admin override
Admin tab to manually mark domain verified (for the 3a manual SSL step), force-recheck, or revoke a custom domain.

### Deliverables — Phase 3
- 1 migration (domain status fields)
- New components: `DomainOnboardingWizard`, `DomainStatusCard`
- New edge function: `verify-custom-domain` (DNS + TXT lookup using Deno's DNS APIs)
- Extended `mini-site-health-check` cron: also re-verifies custom domains
- Admin UI: domain management table

---

## What this gives you at 6,000 instructors

- Every site loads from cached host→instructor lookup (sub-50ms).
- Every site has unique meta, OG, JSON-LD, and editable copy → real SEO, no duplicate-content penalty.
- Sitemap scales via index + paginated children (Google-compliant).
- Daily health check surfaces broken sites before instructors complain.
- Instructors self-serve their own domains; you only do the final SSL add until Lovable exposes a domain API.
- Admin can find, filter, fix any of 6,000 sites in seconds.

## Order & timing

Strict sequence: Phase 1 → 2 → 3. Phase 1 unblocks 2 (defensive reads, indexes), Phase 2 unblocks 3 (instructors need a place to enter their domain in their portal).

I'll execute Phase 1 in full, pause for you to verify, then continue. Approve to start.
