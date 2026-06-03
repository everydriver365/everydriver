# Fix 404 on bookings.drive365.co.uk/booking/chapmans

## Problem

`DomainRouter` only allows three path prefixes on the `bookings.drive365.co.uk` subdomain: `/courses`, `/book/`, `/booking-confirmation`. The combined booking page (the Chapman's portal) lives at `/booking/:slug`, which isn't in that list, so the router force-redirects every visit to `/courses` — producing the 404 / wrong-page result you saw.

## Change

Edit `src/components/DomainRouter.tsx` — extend the `BOOKING_ALLOWED` array inside the `isBookingSubdomain()` branch to include `/booking/`:

```ts
const BOOKING_ALLOWED = ["/courses", "/book/", "/booking", "/booking-confirmation"];
```

No other files, routes, or backend changes are needed. The `/booking/:slug` route is already registered in `publicRoutes.tsx` and the `chapmans` row exists in `booking_pages`.

## Verify

After publishing the frontend, `https://bookings.drive365.co.uk/booking/chapmans` should render the Chapman's-branded combined page (orange hero, both instructors listed).
