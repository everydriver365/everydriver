

## Plan: White-Label School System — Link Instructors to Schools

### What this delivers
A school owner gets a branded booking page showing only their instructors. Their dashboard filters all data (pupils, lessons, earnings) to their team only. Each school gets a unique URL slug for their white-label portal.

### Database changes (migration)

1. **Add `slug` and `custom_domain` columns to `schools`**
   - `slug TEXT UNIQUE` — used for URLs like `/school/acme-driving`
   - `custom_domain TEXT` — optional, for full white-label domains
   - `description TEXT` — school bio for booking page
   - `contact_email TEXT`, `contact_phone TEXT`

2. **Add public SELECT policy on `schools`** for the booking page (read-only, non-PII fields only via a view)

### New pages/components

3. **`/school/:slug` — Public school booking page**
   - Fetches school by slug
   - Lists only instructors linked via `school_instructors`
   - Applies school branding (logo, brand_colour, name)
   - Each instructor card links to their individual booking flow
   - Mobile-responsive grid layout

4. **Enhance `SchoolDashboard.tsx`**
   - Add slug management (auto-generate from name, allow editing)
   - Add shareable booking link display
   - Add instructor invite/remove functionality (currently just shows a school ID code)

### Route additions

5. **Add route** `/school/:slug` in `publicRoutes.tsx` pointing to the new `SchoolBookingPage`

### Data filtering logic

6. **School-scoped queries** — The school dashboard already filters by instructor IDs from `school_instructors`. The booking page will use the same pattern: fetch `school_instructors` → get instructor IDs → query only those instructors' availability.

### Files to create/modify

| File | Action |
|------|--------|
| `supabase/migrations/...` | Add slug, custom_domain, description, contact fields to schools |
| `src/pages/SchoolBookingPage.tsx` | **New** — public white-label booking portal |
| `src/pages/SchoolDashboard.tsx` | Enhance with slug management, invite flow |
| `src/routes/publicRoutes.tsx` | Add `/school/:slug` route |

### What this does NOT include (future work)
- Custom domain DNS routing (requires infrastructure beyond the app)
- School-level payment collection/splitting
- School admin roles beyond the owner

