

## Plan: Admin-Configurable Booking Pages

### What this delivers
- A new **"Booking Pages"** section in the admin sidebar where admins can create and manage branded booking page configurations
- Each booking page can be scoped to a **single instructor** or a **school** (all its instructors)
- Each config generates a unique public URL: `/booking/:slug`
- The public page shows only the relevant instructor(s) with branding from the config

### Database changes

1. **New `booking_pages` table:**
   - `id UUID PRIMARY KEY`
   - `name TEXT` — admin label (e.g. "John's Booking Page")
   - `slug TEXT UNIQUE NOT NULL` — URL path segment
   - `page_type TEXT` — `'instructor'` or `'school'`
   - `instructor_id UUID REFERENCES instructors(id)` — set when type is instructor
   - `school_id UUID REFERENCES schools(id)` — set when type is school
   - `heading TEXT` — custom hero heading
   - `description TEXT` — subtitle/description
   - `logo_url TEXT` — optional logo override
   - `brand_colour TEXT` — hex colour for hero
   - `is_active BOOLEAN DEFAULT true`
   - `created_at / updated_at TIMESTAMPTZ`
   - Public SELECT RLS policy (for the public page to read)
   - Authenticated INSERT/UPDATE/DELETE policies (admin only via `has_role`)

### Admin UI

2. **New `AdminBookingPagesManager` component** under a new sidebar section "Booking Pages" (in the Platform group):
   - Table listing all booking pages with name, type, slug, status
   - Create/edit dialog: pick type (instructor or school), select the entity, set slug, heading, description, logo, brand colour
   - Toggle active/inactive
   - Copy shareable URL button
   - Delete option

3. **Add to admin sidebar** — new item `{ key: "booking-pages", label: "Booking Pages", icon: Globe }` in the Platform group

4. **Add to `AdminPortal.tsx`** — import and render `AdminBookingPagesManager` for the `booking-pages` section

### Public Booking Page

5. **New `PublicBookingPortal.tsx`** at route `/booking/:slug`:
   - Fetches `booking_pages` by slug
   - If type is `instructor`: shows single instructor card with Book Now linking to `/book/:instructorId`
   - If type is `school`: fetches school's instructors via `school_instructors` junction table, shows grid (similar to existing `SchoolBookingPage`)
   - Applies branding (logo, colour, heading) from the booking page config
   - Falls back to instructor/school defaults if not overridden
   - DSM logo footer

6. **Add route** `/booking/:slug` to `publicRoutes.tsx`

### Files to create/modify

| File | Action |
|------|--------|
| Migration SQL | Create `booking_pages` table with RLS |
| `src/components/admin/AdminBookingPagesManager.tsx` | New — admin CRUD for booking pages |
| `src/pages/PublicBookingPortal.tsx` | New — public booking page |
| `src/pages/AdminPortal.tsx` | Add section meta + render case |
| `src/components/admin/AdminDesktopSidebar.tsx` | Add "Booking Pages" item |
| `src/routes/publicRoutes.tsx` | Add `/booking/:slug` route |

