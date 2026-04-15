

## Plan: Upcoming Events Tile + Admin Event Manager

### What we're building
1. A new database table `admin_events` to store upcoming events (webinars, shows, etc.)
2. An "Upcoming Events" tile on the instructor home page, placed after the `BottomPromoGroup`
3. An admin section to create/edit/delete events
4. Seed the first event (DVSA Booking System webinar, 23rd April)

### Database
- New `admin_events` table: `id`, `title`, `description`, `event_date` (timestamptz), `duration_minutes`, `event_type` (online_webinar / in_person / show), `link_url`, `link_label`, `is_active`, `created_at`
- RLS: SELECT for authenticated users, full CRUD for admins via `has_role`

### Instructor Home — New Component
- `UpcomingEventsCard` placed below `BottomPromoGroup` in all home view variants
- Fetches active events where `event_date > now()`, ordered by date, limit 5
- Each event row shows: date/time badge, title, description snippet, and a tappable link button
- Styled consistently with the existing iOS card aesthetic (rounded-2xl, border, bg-card)
- Calendar icon with purple accent to distinguish from existing tiles

### Admin Portal — New Section
- `AdminEventsManager` component: table of events with create/edit/delete
- Form fields: title, description, date/time, duration, type, link URL, link label, active toggle
- Added to `sectionMeta` and the admin navigation grid under "Engagement & Rewards"

### Seed Data
- Insert the DVSA webinar event (23 April 2025, 18:00, 60 min, with the provided Teams link)

### Files to create/modify
- **Migration**: Create `admin_events` table with RLS
- **New**: `src/components/instructor/UpcomingEventsCard.tsx`
- **New**: `src/components/admin/AdminEventsManager.tsx`
- **Modified**: All home view variants to add `UpcomingEventsCard` after `BottomPromoGroup`
- **Modified**: `src/pages/AdminPortal.tsx` — add section metadata, import, and render
- **Insert**: Seed the DVSA event row

