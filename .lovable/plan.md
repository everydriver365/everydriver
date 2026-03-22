

## Plan: Website Add-On Monetisation — Monthly Upsells

### Philosophy
Position EveryDriver as the **one-stop shop** — every instructor need (diary, payments, website, domain, hosting, SEO, compliance) handled in one place. Monetise via monthly add-on tiers on top of the core subscription plans, not one-off charges.

### New Monthly Add-Ons

| Add-On | Price | What They Get | Free Tier Equivalent |
|--------|-------|---------------|---------------------|
| **Pro Website** | £4.99/mo | Multi-page CMS (5 pages: Home, About, Services, Reviews, Contact), custom SEO meta tags, Google Analytics integration, schema markup | 1-page mini-site (already exists) |
| **Custom Domain** | £1.99/mo | Custom domain (e.g. johnsdriving.co.uk) linked to their mini-website, automatic DNS management | Free subdomain (slug.drive365.co.uk) |
| **SSL + Hosting** | £2.99/mo | Dedicated SSL certificate, priority CDN hosting, uptime monitoring badge, faster page loads | Shared hosting on platform subdomain |
| **SEO Boost** | £3.99/mo | Auto-generated sitemap, Google Search Console integration, local SEO optimisation (Google Business Profile sync), monthly SEO health report | Basic meta tags only |

**Bundle: "Website Pro Pack"** — All 4 add-ons for **£9.99/mo** (save £3.96/mo). This becomes the recommended upsell.

### How It Fits the Current System

The existing `subscription_plans` + `instructor_subscriptions` model handles the base plan. Add-ons would be tracked in a new `instructor_addons` table, each with its own GoCardless subscription line.

### Database Changes

**New table: `instructor_addons`**
```sql
CREATE TABLE instructor_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,
  addon_type text NOT NULL, -- 'pro_website', 'custom_domain', 'ssl_hosting', 'seo_boost', 'website_pro_pack'
  status text DEFAULT 'active',
  price_monthly numeric DEFAULT 0,
  gocardless_subscription_id text,
  started_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  UNIQUE(instructor_id, addon_type)
);
ALTER TABLE instructor_addons ENABLE ROW LEVEL SECURITY;
```

**New rows in `comparison_features`** — Add each add-on as a feature row showing ✗ on Free, optional add-on on paid plans.

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `instructor_addons` table + RLS + insert comparison features |
| `src/pages/InstructorWebsiteAddons.tsx` | **New** — Add-ons marketplace page showing 4 cards + bundle, purchase via GoCardless |
| `src/hooks/useInstructorAddons.ts` | **New** — Hook to fetch active add-ons for the current instructor |
| `src/components/instructor/WebsitePageEditor.tsx` | Gate multi-page editing behind `pro_website` add-on |
| `src/pages/InstructorDomainsManagement.tsx` | Gate custom domain linking behind `custom_domain` add-on |
| `src/components/instructor/InstructorDesktopSidebar.tsx` | Add "Website Add-ons" nav item |
| `src/routes/instructorPortalRoutes.tsx` | Add route for `/instructor/website-addons` |
| `src/components/instructor/dashboard/UpgradePlanSheet.tsx` | Show add-ons section below plan comparison |

### Gating Logic
- `useInstructorAddons()` returns active add-on types
- Components check `hasAddon('pro_website')` before enabling multi-page editing
- Free users see a teaser of what they'd get with an upgrade prompt
- Bundle purchase automatically activates all 4 individual add-ons

### What This Means for Revenue
With 1,000 instructors:
- 20% buy Pro Website (£4.99) = £998/mo
- 30% buy Custom Domain (£1.99) = £597/mo  
- 15% buy the Bundle (£9.99) = £1,499/mo
- **Potential: £3,000+/mo in add-on revenue alone**, on top of subscription fees

