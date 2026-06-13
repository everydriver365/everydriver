---
name: Network placeholder instructors are PARKED
description: All 5,796 Drive365 Network placeholders are soft-parked (is_active=false). They must never appear on any public surface. Out-of-area searches show the coverage waitlist instead.
type: constraint
---

# Network placeholder instructors — parked

As of 2026-06-13 all 5,796 rows where `instructors.is_network_placeholder = true`
have been set to `is_active = false`. They are intentionally invisible to pupils.

## Rules

- **Never re-activate in bulk.** Re-activation is per-row, done by an admin
  from `/admin/network-instructors` only when a real instructor is
  onboarded to take over the area.
- Public queries already filter `.eq("is_active", true)` everywhere — that
  filter alone is enough to keep placeholders hidden. Do not add code paths
  that ignore `is_active`.
- Admin list/count queries against `instructors` still need
  `.eq("is_network_placeholder", false)` to keep them out of the main admin
  Instructors list. The dedicated section is `/admin/network-instructors`.
- `/i/network-*` mini-site slugs redirect to `/contact?postcode=…&reason=out-of-area`
  (handled in `MiniWebsiteHome.tsx`). `robots.txt` also `Disallow: /i/network-`.
- Sitemap (`mini-website-sitemap` edge function) already filters
  `is_active = true`, so placeholders are naturally excluded.

## Out-of-area UX

When a pupil's postcode has zero real (non-placeholder, active) instructors,
render `<OutOfAreaWaitlistCard />` which writes to `public.coverage_waitlist`
with `source = 'out_of_area_waitlist'`. Admins read this list to prioritise
instructor recruitment.

## Why

Placeholders caused repeated regressions (Featured Courses crowded out,
slow searches, dead-end bookings). Soft-parking is reversible per-row,
preserves SEO via redirects, and turns "we don't cover this area" into a
useful demand signal.
