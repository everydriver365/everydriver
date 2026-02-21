

## Add `bookings.drive365.co.uk` Subdomain for Booking Access

### What You'll Get

A dedicated subdomain (`bookings.drive365.co.uk`) that serves as a standalone booking portal. When visitors land on it, they'll see the instructor search/browse page (the existing Courses page) where they can find an instructor and book directly. The existing booking pages within the main app will continue to work exactly as they do now.

### How It Works

1. Visitor goes to `bookings.drive365.co.uk`
2. They see the instructor search page (postcode search, filters, course cards)
3. They pick an instructor/course and are taken to the booking flow (`/book/:instructorId`)
4. The full booking and confirmation flow works on the subdomain

All other routes (instructor app, pupil portal, admin, etc.) are blocked on this subdomain -- visitors can only access the booking-related pages.

### DNS Setup (You Do This)

At your domain registrar, add an **A record**:
- **Name:** `bookings`
- **Type:** A
- **Value:** `185.158.133.1`

Then add `bookings.drive365.co.uk` as a custom domain in your Lovable project settings under Domains. SSL will be provisioned automatically.

### What Changes in Code

**1. `src/components/DomainRouter.tsx`** -- Add booking subdomain detection

- Add `bookings.drive365.co.uk` to a new constant for the booking subdomain
- Add a helper function `isBookingSubdomain()` that checks if the current hostname matches
- In the routing logic, when on the booking subdomain:
  - Root path (`/`) redirects to `/courses` (the search/browse page)
  - Only allow `/courses`, `/book/`, and `/booking-confirmation` routes
  - Block all other routes by redirecting back to `/courses`

**2. `src/hooks/useDomainBranding.ts`** -- Add booking subdomain branding

- Detect the booking subdomain and return Drive365 branding (since it's a subdomain of drive365.co.uk)
- Set `isLearnerDomain: true` so the correct styling applies

### What Will NOT Change

- The existing `/book/:instructorId` route continues to work on all current domains
- The `/courses` page remains unchanged -- it just also serves as the landing page on the booking subdomain
- No database changes required
- No new pages need to be created
- All payment callbacks (Square, Klarna, etc.) will work correctly since they use `window.location.origin`

### Technical Details

The core change is roughly 20 lines added to `DomainRouter.tsx`:

```text
New constant:
  BOOKING_SUBDOMAIN = "bookings.drive365.co.uk"

New helper:
  isBookingSubdomain() -- checks hostname

Updated routing logic:
  if (isBookingSubdomain) {
    if path is "/" -> redirect to /courses
    if path not in [/courses, /book/, /booking-confirmation] -> redirect to /courses
  }
```

The `useDomainBranding.ts` hook gets a small addition to recognise the subdomain and return Drive365 branding, ensuring the header/footer show the correct logo and brand name.

