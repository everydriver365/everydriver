
# External Booking Surface

Lets another Lovable project show a curated subset of instructors, read their availability directly, and create bookings + take payment via two edge functions here.

## What gets built (this project only)

### 1. Database

**Table `public.external_booking_allowlist`**
- `instructor_id` (fk to instructors)
- `partner_key` (text, e.g. `project_x`)
- `is_active` (bool, default true)
- `notes` (text, nullable)
- timestamps
- Unique (`instructor_id`, `partner_key`)
- RLS: admin-only read/write; edge functions use service role

**RPC `public.list_external_bookable_instructors(p_partner_key text)`**
- SECURITY DEFINER, returns the public-safe instructor fields (id, name, profile image, brand colour, area, car type, hourly rate, enabled payment methods flags) for instructors on the active allow-list for that partner.
- Grants `EXECUTE` to `anon` so the other project's frontend can call it with just the anon key.

**RPC `public.get_external_instructor_busy_blocks(p_partner_key, p_instructor_id, p_from, p_to)`**
- SECURITY DEFINER. Returns only opaque busy blocks (start/end) sourced from `instructor_calendar_events` + `instructor_manual_blocks` + existing `scheduled_lessons` — never pupil names or details. Respects the Google-Calendar-as-source-of-truth rule.
- Grants `EXECUTE` to `anon`.

### 2. Edge functions (verify_jwt = false, partner-key auth)

**`public-create-booking`**
- Inputs: `partner_key`, `instructor_id`, pupil contact (name, email, phone, postcode), `start_at`, `duration_minutes`, optional notes.
- Validates partner key (secret), verifies instructor is on the active allow-list, re-runs availability check (London tz, buffers, travel time — using existing `availabilityCore` logic / RPC), upserts pupil by email+instructor, inserts `scheduled_lessons` row with `source = 'partner:<key>'`, geocodes pickup via postcodes.io, lets the existing trigger sync Google Calendar.
- Returns `booking_id`, `instructor_id`, `total_amount`, `enabled_payment_methods`.

**`public-start-payment`**
- Inputs: `partner_key`, `booking_id`, `method` (`square` | `gocardless` | `klarna` | `clearpay`), pupil contact, return/cancel URLs.
- Re-validates partner key + booking ownership, reads the instructor's enabled gateways, invokes the existing payment edge function for that method, returns `{ checkoutUrl }` or QR payload. Reuses existing Service Fee + platform fee + split logic — no new payment plumbing.

### 3. Admin screen — `/admin/external-partners`

- Table of partners (rows from distinct `partner_key`) with on/off toggle.
- For the selected partner: searchable instructor picker → tick to add to allow-list, untick to remove, with active toggle per row.
- Read-only list of bookings where `source LIKE 'partner:%'` with partner, instructor, pupil, date, amount, payment status.
- Route added to `adminRoutes.tsx` behind `ProtectedAdminRoute`.

### 4. Secret

- `EXTERNAL_BOOKING_PARTNER_KEYS` — JSON map `{ "project_x": "<random-long-key>" }`. Added via secrets tool after migration approval. Other project sends its key in an `x-partner-key` header.

## What the other project needs (handoff, not built here)

Three values:
1. `VITE_SUPABASE_URL` of this project
2. Anon key of this project
3. Partner key (the secret value)

Plus this contract:
- Read instructors: `supabase.rpc('list_external_bookable_instructors', { p_partner_key })`
- Read busy blocks: `supabase.rpc('get_external_instructor_busy_blocks', {...})`
- Create booking: `POST /functions/v1/public-create-booking` with `x-partner-key` header
- Start payment: `POST /functions/v1/public-start-payment` with `x-partner-key` header

## Out of scope

Pupil login on the partner site, lesson history/progress sharing, edit/cancel from partner, marketplace SEO pages, new payment gateways.

## Build order

1. Migration (allow-list table + 2 RPCs + grants + RLS)
2. Add `EXTERNAL_BOOKING_PARTNER_KEYS` secret
3. `public-create-booking` edge function
4. `public-start-payment` edge function
5. Admin screen + route
6. Hand you the 3 values + the contract snippet to paste into the other project
