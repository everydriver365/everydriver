

## Mobile-Friendly Audit Results

### Already Mobile-Optimized
- Public-facing pages (homepage, courses, theory, FAQs, help, benefits) — responsive layouts + mobile bottom nav
- Instructor portal — premium iOS-style mobile UI with bottom nav, large titles, search, sheets
- Pupil portal — mobile header, responsive content
- Parent portal — mobile bottom nav, responsive sections
- Booking flow — responsive grid layouts throughout

### Needs Work: Admin Portal (`/admin`)

The admin portal is **desktop-only**. Key issues:

1. **No mobile navigation** — the overview grid of 30+ section tiles has no mobile-friendly layout; no hamburger menu or bottom nav
2. **Fixed header** — logo + search + logout in a single row with `px-6`, no responsive padding; search box may overflow
3. **Breadcrumb** — not collapsible on small screens
4. **Content area** — `p-6` fixed padding; Cards and tables inside sections (InstructorList, PupilRecords, etc.) likely overflow horizontally
5. **Dialogs** — `max-w-2xl` may be fine but forms inside could be tight

### Proposed Fix

**Phase 1 — AdminLayout responsive adjustments:**
- Reduce header/content padding on mobile (`px-3 md:px-6`, `p-3 md:p-6`)
- Make breadcrumb scrollable or truncated on small screens
- Add a collapsible hamburger menu or bottom nav for section navigation on mobile

**Phase 2 — Overview grid:**
- Change the section tile grid from multi-column to single-column on mobile
- Make notification tiles stack vertically

**Phase 3 — Inner section components:**
- Audit key admin components (InstructorList, PupilRecordsManager, tables) for horizontal overflow
- Add `overflow-x-auto` on table wrappers and responsive column hiding

This is a significant effort given 30+ admin sections. I recommend starting with Phase 1 (layout shell) which gives the biggest impact for minimal changes.

