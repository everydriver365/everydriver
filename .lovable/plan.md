
## Goal

Guarantee that every UK postcode returns at least one bookable-looking result on the Drive365 course search, even where Drive365 has no real instructor yet. Pupils never see a dead end — they see a "network" instructor card and submit an enquiry, which becomes a lead.

## Scope (from your answers)

- **Granularity:** postcode district (~2,900 districts, e.g. `SW1A`, `WD17`, `EH3`)
- **Coverage:** Manual + Automatic for every district → **~5,800 mock instructors**
- **Courses:** every active `course_templates` row attached to each mock → roughly 50–80k `instructor_courses` rows depending on template count
- **Booking mode:** `enquiry_only` (already a supported value)
- **Visibility:** shown **only** when no real instructor covers the searched postcode
- **Names:** auto-generated, unique per mock (first-name pool × last-name pool, deterministic by district+transmission so re-seeds are stable)

## Heads-up — conflicts with project memory

Two existing rules touch this:

1. *"Demo Data: Do not pollute live DB. Use Demo Mode boolean flag with client-side overlay."*
2. *"LIVE DATA ONLY: Never use hard-coded values, mock data, or fallbacks…"*

What you're asking for is a deliberate, product-level exception: these aren't dev fixtures, they're real lead-capture placeholders that exist for a business reason. To stay honest with the memory rules I'll:

- Tag each row with **both** `demo_mode = true` **and** a new dedicated column `is_network_placeholder = true` so they're trivially excludable from any analytic / instructor-portal query.
- Add a clear visual label on the card ("Network instructor — enquire for availability") so pupils aren't misled into thinking they're booking a specific real ADI.
- Update `mem://constraints/no-hardcoded-fallbacks-live-data-only` to record the exception.

If you'd rather keep the memory rule absolute, say so and I'll stop here.

## How it works end-to-end

```text
Pupil enters postcode "WD17 3"
        │
        ▼
useCourseDiscovery.handleSearch
        │
        ├─ finds real instructors within radius?  ──► show them, hide placeholders
        │
        └─ none found?  ──► look up district "WD17"
                            show the two placeholder cards
                            (1× Manual, 1× Automatic)
                            CTA: "Enquire" → existing EnquiryFlow
                            → row written to course_enquiries
```

## Plan

### 1. Schema migration

Add a flag and supporting infrastructure on `instructors`:

- `is_network_placeholder boolean NOT NULL DEFAULT false`
- `placeholder_district text` (e.g. `WD17`) — indexed
- Partial index `WHERE is_network_placeholder = true` on `(placeholder_district, car_type)` for fast lookup
- Update the `public_instructors` view to expose `is_network_placeholder` and `placeholder_district`
- Tweak any analytics/leaderboard RLS or RPC that counts instructors to exclude placeholders (audit list: `instructor_premium_placements`, dashboards, admin counters)

### 2. Seed data (one-off migration + script)

- Bundle a UK postcode-district list (~2,900 entries) as a CSV checked into `supabase/migrations/` and load via `COPY`.
- For each district × `{Manual, Automatic}`:
  - Generate a deterministic name from a curated first/last name pool (hash of `district+transmission` → index into pool, with collision suffix).
  - Insert `instructors` row: `is_active=true`, `booking_mode='enquiry_only'`, `is_network_placeholder=true`, `demo_mode=true`, `placeholder_district='WD17'`, `home_postcode='WD17 1AA'` (representative), `radius_miles=8`, `car_type='Manual'|'Automatic'`, `hourly_rate=NULL`, `auth_user_id=NULL`, `app_slug='network-wd17-manual'`.
  - For each active `course_templates` row, insert an `instructor_courses` row with `is_active=true`, no overridden price (uses template default in UI).
- Idempotent: re-run inserts are `ON CONFLICT (placeholder_district, car_type) DO NOTHING` on a new unique constraint.

### 3. Search filtering — `src/hooks/useCourseDiscovery.ts`

- Pull `public_instructors` as today, plus `is_network_placeholder`.
- After `handleSearch` computes real-instructor matches inside `radiusMiles`:
  - If any non-placeholder real instructor matches → filter placeholders out of the result set entirely.
  - If none → keep only the two placeholders whose `placeholder_district` equals the searched postcode's district (split before the space, e.g. `WD17`).
- Sort: real first, placeholders always last regardless of `sortBy`.

### 4. UI

- `InstructorCard` (and the course cards): when `is_network_placeholder` is true, render a small badge "Drive365 Network — enquire for availability", suppress hourly rate / "next available" calendar dots, and replace the primary CTA with **Enquire**.
- Skip the standard profile page — placeholder profile route shows a stripped-down "Submit enquiry" page that posts to `course_enquiries` (existing table) with `instructor_id` set to the placeholder so the lead can later be reassigned to a real instructor onboarded in that district.

### 5. Admin / ops surface (light)

- Add a tiny admin tool: "Convert placeholder → real instructor" button on the placeholder's admin page that flips `is_network_placeholder=false`, clears `placeholder_district`, and lets a real ADI claim the row (or alternatively soft-deletes the placeholder when the real instructor's home_postcode covers that district).

### 6. Memory update

Append an exception note to `mem://constraints/no-hardcoded-fallbacks-live-data-only` documenting: *placeholder network instructors are an explicit product feature, are real DB rows tagged `is_network_placeholder=true`, and must be excluded from instructor analytics and revenue counts.*

## Technical notes

- ~5,800 instructor rows + ~50k course rows is comfortably small for Postgres; the partial index on `is_network_placeholder` keeps real-instructor queries unaffected.
- `prevent_lesson_clash`, calendar sync, payments, payouts — none can fire because `booking_mode='enquiry_only'` short-circuits the booking flow into `EnquiryFlow` before any `scheduled_lessons` row is created.
- `auth_user_id IS NULL` means nobody can log in as a placeholder — RLS naturally denies any portal access.
- The two-step "find real first, fallback to placeholder" runs entirely client-side after the existing data fetch, so no extra round-trip.
- `course_enquiries` already exists and is the natural sink for the lead. We just need to make sure its RLS allows anonymous inserts (it should — confirm during implementation).

## What I need from you before building

1. Confirm you're happy with the **memory-rule exception** above.
2. Confirm the **fallback-only** visibility (real instructor wins, placeholder never shown alongside).
3. Any preference on the **name pool** — neutral British names mixed gender, or supply your own list?
