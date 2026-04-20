
## Plan: "Find appointment" search for Admin & School portals

Add an EMIS-style appointment finder modal that searches all instructors (Admin) or school instructors (School portal) and lists the next available bookable slots in a table — sortable by date, with filters for date range, instructor(s), duration, and location/postcode.

### What it does
A user opens "Find appointment" from a button. They pick:
- **Search from** (date picker, defaults today)
- **Duration** (45 / 60 / 90 / 120 min)
- **Instructors** — "All" or pick specific ones
- **Postcode + radius** (optional, filters to instructors covering that area)
- **Time of day** (Any / Morning / Afternoon / Evening)

Results appear in a scrollable table matching the screenshot's columns:
`Date | At | Duration | Instructor | Car type | Postcode area | Book`

Clicking a row opens the existing `BespokeBookingModal` (Admin) or `SchoolTakeBookingModal` (School) pre-filled with the chosen instructor + date + time.

### Files to create
1. **`src/hooks/useInstructorAvailabilitySearch.ts`** — accepts `{ instructorIds, fromDate, days, durationMinutes, timeOfDay, postcode?, radius? }` and returns flat `AvailableSlot[]` rows by reusing the same data sources as `useRealGapSlots`:
   - `instructor_working_hours`, `instructor_date_overrides`
   - `scheduled_lessons`, `instructor_manual_blocks`, `instructor_calendar_events`
   - For each instructor × day, walk working hours in 15-min steps, emit slots of requested duration that don't collide with any conflict, respect first-lesson buffers (existing memory rule).
   - Postcode filter: join `instructors.home_postcode` + `radius_miles`; do simple postcode-prefix match if no geocoder available, otherwise haversine if lat/lng exists.
   - Sorted ascending by datetime; capped at ~200 results.

2. **`src/components/shared/FindAppointmentModal.tsx`** — shared dialog, props: `{ open, onClose, instructorIds, mode: "admin" | "school", onSelectSlot(slot) }`. Layout mirrors the screenshot:
   - Top: criteria panel (grid of inputs)
   - Bottom: results table with sticky header, "Earlier / Later appointments" pagination links
   - Bottom-right: `Clear criteria` · `Book appointment` (enabled when row selected) · `Cancel`

### Files to edit
3. **`src/pages/AdminPortal.tsx`** — add a `find-appointment` section + sidebar nav entry under "People", and a quick-launch button on the Overview tile row. Selecting a slot opens the existing `BespokeBookingModal` with prefilled values.

4. **`src/pages/SchoolPortal.tsx`** — same pattern: add `find-appointment` case routed to a new `SchoolFindAppointmentSection` wrapper that scopes to `instructorIds` and opens `SchoolTakeBookingModal` on slot select.

5. **`src/components/admin/AdminLayout.tsx`** + **`src/components/school/SchoolLayout.tsx`** — add nav item "Find appointment" (Search icon) under People / Bookings group respectively.

6. **`src/components/admin/BespokeBookingModal.tsx`** + **`src/components/school/SchoolTakeBookingModal.tsx`** — accept optional `prefill={ instructorId, date, time, duration }` props.

### Visual style
- Admin: existing DSM card styles (white cards, rounded-2xl, slate text)
- School: same DSM theme already used in school portal
- Table rows: 40px tap target, hover highlight, alternating subtle row background, selected row in primary tint
- No emoji, sentence case, follows existing portal design system

### Out of scope
- Map view of slots
- Auto-assigning to nearest instructor
- Booking from the modal directly without confirmation step

### Verification
- Open Admin portal → People → Find appointment → criteria default to today + 60 min + all instructors → table populates
- Filter by single instructor → only their free slots show
- Click a row → BespokeBookingModal opens prefilled
- Same flow on School portal scopes to school's instructors only
