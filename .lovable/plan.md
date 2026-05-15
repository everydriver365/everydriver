## Goal
Add a "Discount / Special Offer" feature to course pricing, manageable from both the admin and instructor portals, and surfaced on course cards and course summary pages.

## Today
`public.instructor_courses` already has a `discounted_price` column, but it's not editable in the instructor UI, has no offer label/expiry/tag, and isn't rendered as a "discount" anywhere — `hourly_rate × hours` is shown as the price. There's nothing for an admin to override either.

## Plan

### 1. Database (migration)
Extend `public.instructor_courses` with offer metadata:
- `offer_label text` — e.g. "Summer Sale", "New Driver Deal" (shown as a badge)
- `offer_starts_at timestamptz` (nullable) and `offer_ends_at timestamptz` (nullable) — controls whether the offer is currently live
- `offer_active boolean default false` — master on/off so an instructor can prep a deal without showing it
- Keep existing `discounted_price` as the override price.

No RLS changes needed (existing policies already allow instructor + admin to update).

### 2. Instructor portal — `InstructorCoursesManager.tsx`
For each enabled course row, add an "Offer" pencil button that opens a small dialog with:
- Discounted price (£) — required if offer enabled
- Offer label (text, ≤30 chars)
- Optional start / end dates
- "Show this offer to pupils" switch (`offer_active`)
- "Remove offer" button

Show a small price preview ("Was £X · Now £Y · Save £Z") inside the dialog using `hourly_rate × course_hours`.

### 3. Admin portal
In the existing instructor course editor (admin side, used in `InstructorForm` / course management), surface the same offer fields so support staff can run promotions on behalf of instructors.

### 4. Helper
Add a small util `getCourseOfferStatus(course)` returning `{ isLive, basePrice, finalPrice, savings, label }` so all card/summary surfaces compute the same way (live = `offer_active && discounted_price && now within window`).

### 5. UI surfaces — show the offer
Update these to show a strikethrough base price, the discounted price, savings, and the offer label badge:
- `src/components/CourseCard.tsx`
- `src/components/courses/MobileCourseCard.tsx`
- `src/components/IOSCourseCard.tsx`
- `src/components/DynamicCourseCard.tsx`
- `src/components/mini-website/MiniWebsiteCourseCard.tsx`
- `src/pages/BookingSummary.tsx` and `src/pages/everydriver/BookingSummary.tsx` (course summary — show "Was / Now / You save" line and badge near total)

`useCourseDiscovery.ts` already exposes `discounted_price`; extend its select + returned shape to include the new offer fields and pass through to cards.

### 6. Out of scope (flag now, do later if you want)
- Promo codes / coupon entry at checkout
- Per-pupil targeted discounts
- Sitewide platform-set discount banners
- Persisting the discounted amount onto the actual `bookings`/`payment_history` row (today the booking flow charges the displayed final price; we'll keep that behaviour, just driven by the new offer logic).

## Questions before I build
1. Should the discount be entered as a **fixed final price** (current `discounted_price`), a **percentage off**, or **either**? Percentage is friendlier for "20% off" promos.
2. Do you want **start/end dates** at all, or just an on/off toggle per course?
3. Should the **admin** be able to set a discount that the instructor can't edit (locked promo), or is admin access just a convenience that mirrors the instructor's own controls?
