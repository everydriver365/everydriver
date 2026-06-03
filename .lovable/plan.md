# Chapman's Combined Booking Page

A single standalone URL — `https://bookings.drive365.co.uk/booking/chapmans` — branded as Chapman's Driving School, listing both Richard Chapman and Ken D as bookable instructors. Chapman's website links out to it in a new tab. Each "Book Now" button continues into the existing per-instructor booking flow (`/book/:instructorId`), so no booking, availability, or payment logic changes.

## What the visitor sees

- Chapman's logo + brand colour in the hero
- Heading + short description (configurable)
- Two instructor cards (Richard, Ken) using the same card design as the existing `PublicBookingPortal`
- "Book Now" on each card → existing `/book/:instructorId` flow → Drive365 calendar + payment

## Build steps

### 1. Database (one migration)

Extend the existing `booking_pages` system so a page can list an arbitrary set of instructors (not tied to a school):

- Add `'group'` as an allowed value for `booking_pages.page_type`
- New join table `public.booking_page_instructors`:
  - `booking_page_id` (fk → booking_pages, cascade)
  - `instructor_id` (fk → instructors, cascade)
  - `display_order` (int, default 0)
  - Unique (`booking_page_id`, `instructor_id`)
  - GRANTs: `SELECT` to `anon` + `authenticated`; `ALL` to `service_role`
  - RLS: public `SELECT` where parent page `is_active`; admin-only write via existing `has_role(auth.uid(),'admin')`

### 2. Seed Chapman's page

Insert one row into `booking_pages`:
- `slug = 'chapmans'`
- `name = "Chapman's Driving School"`
- `page_type = 'group'`
- `heading = "Book a Driving Lesson with Chapman's"`
- `description` = short Chapman's blurb (you supply, or default)
- `brand_colour` = Chapman's brand hex (you supply)
- `logo_url` = Chapman's logo (uploaded to storage, you supply or I use a placeholder you swap later)
- `is_active = true`

Insert two rows into `booking_page_instructors` linking Richard Chapman + Ken D, display_order 0 and 1.

### 3. Frontend — extend `PublicBookingPortal.tsx`

Add a branch for `page_type === 'group'`: fetch instructor IDs from `booking_page_instructors` ordered by `display_order`, then load them from `public_instructors` (same shape as the existing school branch). No other UI changes — reuses the existing hero + card grid + footer.

### 4. Admin (lightweight)

Add a small "Group pages" section to the existing admin booking-pages screen so you can edit Chapman's heading/colour/logo and add/remove instructors without SQL. If you'd rather skip this for now and just edit via DB, say so and I'll drop step 4.

## What Chapman's site needs to do

Just one link/button:

```
<a href="https://bookings.drive365.co.uk/booking/chapmans" target="_blank" rel="noopener">
  Book Online
</a>
```

No iframe, no API, no auth.

## Things I need from you (or I'll use sensible defaults)

- Chapman's brand colour (hex)
- Chapman's logo file
- Heading + short description text

If you don't supply these, I'll publish with a placeholder logo and Drive365 default colour, and you can edit later in admin.

## Out of scope

- Embedding inside Chapman's site (iframe)
- New booking, availability, or payment logic
- SEO/marketing pages
- Pupil login on the combined page
