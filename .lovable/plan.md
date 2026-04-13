

## Plan: School Mini-Website with Multi-Page Upgrade

### Current State
- Schools have a **single-page booking page** at `/school/:slug` showing a hero, contact info, and instructor cards
- Schools already have `slug`, `custom_domain`, `logo_url`, `brand_colour`, `description`, `contact_email`, `contact_phone` columns
- Instructors have a full multi-page mini-website system with `instructor_website_pages` table storing per-page content blocks
- Schools do **not** have an equivalent website pages table or multi-page site

### What We'll Build

**1. School Website Pages table** (migration)
- New `school_website_pages` table mirroring the instructor pattern: `school_id`, `page_type` (home/about/services/reviews/contact/instructors), `page_title`, `hero_heading`, `hero_subheading`, `content_blocks` (JSONB), `display_order`, `is_published`
- Auto-generate default pages on school creation via a trigger (similar to `create_instructor_website_pages`)
- Add `website_enabled` and `website_tier` columns to `schools` table (`single_page` = free default, `multi_page` = upgrade)

**2. Add website theme columns to schools** (migration)
- `website_theme`, `website_font`, `website_header_style`, `website_header_bg`, `website_footer_bg`, `website_button_color`, `hero_image_url` — matching the instructor mini-website customisation fields

**3. Public school mini-website pages** (new files)
- `src/pages/school-website/SchoolWebsiteHome.tsx` — Multi-section homepage with hero, about preview, instructor cards, reviews, CTA
- `src/pages/school-website/SchoolWebsiteAbout.tsx` — About the school
- `src/pages/school-website/SchoolWebsiteInstructors.tsx` — Full instructor listing with booking links
- `src/pages/school-website/SchoolWebsiteContact.tsx` — Contact form and details
- `src/pages/school-website/SchoolWebsiteLayout.tsx` — Shared header/footer/nav wrapping all pages, branded with school colours
- Routes: `/school/:slug`, `/school/:slug/about`, `/school/:slug/instructors`, `/school/:slug/contact`

**4. Single-page vs multi-page gating**
- `website_tier = 'single_page'`: Only the homepage renders; nav links to About/Contact/Instructors are hidden
- `website_tier = 'multi_page'`: All pages render with full navigation
- An upgrade CTA banner appears on the single-page tier encouraging the school to upgrade

**5. School Website Manager in school portal** (new file)
- `src/components/school/SchoolWebsiteSection.tsx` — Website editor for school managers
  - Preview link to live site
  - Edit hero image, heading, subheading
  - Theme/colour pickers (brand colour, button colour, font)
  - Per-page content editor (for multi-page tier)
  - Upgrade prompt if on single-page tier
- Add `{ key: "website", label: "Website", icon: Globe }` to SchoolLayout Settings group

**6. Custom domain support**
- The `custom_domain` column already exists on `schools`
- Add domain connection UI in the website section (enter domain, show DNS instructions)
- Update `DomainRouter` to recognise school custom domains (similar to instructor subdomains)

### Files to Create
- `src/pages/school-website/SchoolWebsiteHome.tsx`
- `src/pages/school-website/SchoolWebsiteAbout.tsx`
- `src/pages/school-website/SchoolWebsiteInstructors.tsx`
- `src/pages/school-website/SchoolWebsiteContact.tsx`
- `src/pages/school-website/SchoolWebsiteLayout.tsx`
- `src/components/school/SchoolWebsiteSection.tsx`

### Files to Modify
- `src/components/school/SchoolLayout.tsx` — Add "Website" nav item
- `src/pages/SchoolPortal.tsx` / `DemoSchoolPortal.tsx` — Add `case "website"`
- `src/routes/publicRoutes.tsx` — Add school website sub-routes
- `src/components/admin/AdminSchoolManager.tsx` — Add `website` to `FEATURE_DEFS`

### Database Migration
```sql
-- Website theme columns on schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS website_tier TEXT DEFAULT 'single_page',
  ADD COLUMN IF NOT EXISTS website_theme TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS website_font TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS website_header_style TEXT DEFAULT 'transparent',
  ADD COLUMN IF NOT EXISTS website_header_bg TEXT,
  ADD COLUMN IF NOT EXISTS website_footer_bg TEXT,
  ADD COLUMN IF NOT EXISTS website_button_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- School website pages
CREATE TABLE public.school_website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL,
  page_title TEXT NOT NULL,
  hero_heading TEXT,
  hero_subheading TEXT,
  content_blocks JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, page_type)
);

ALTER TABLE public.school_website_pages ENABLE ROW LEVEL SECURITY;

-- RLS: public read, owner write
CREATE POLICY "Public can view published school pages"
  ON public.school_website_pages FOR SELECT USING (is_published = true);

CREATE POLICY "School owners manage own pages"
  ON public.school_website_pages FOR ALL TO authenticated
  USING (public.is_school_owner(school_id));

CREATE POLICY "Admins manage all school pages"
  ON public.school_website_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### Technical Notes
- Single-page tier shows only the homepage (hero + instructor cards + contact) — no navigation bar
- Multi-page tier unlocks About, Instructors, Contact pages with a full nav header
- The existing `/school/:slug` route will be upgraded from the simple booking page to the full website homepage
- School website pages use the same JSONB `content_blocks` pattern as instructor mini-websites for consistency

