## Goal

Add course cards to the Chapman's combined booking page (`/booking/chapmans` and any other `page_type = "group"` booking page) so visitors see the same Drive365-style course cards they'd see elsewhere on the site — scoped to just the instructors linked to that page.

## What the page will show

```text
┌──────────────────────────────────────────┐
│  Hero (orange — existing)                │
├──────────────────────────────────────────┤
│  Courses                                  │
│  [DynamicCourseCard] [DynamicCourseCard]  │  ← NEW
│  [DynamicCourseCard] [DynamicCourseCard]  │
├──────────────────────────────────────────┤
│  Our Instructors                          │
│  [Instructor card] [Instructor card]      │  ← existing
└──────────────────────────────────────────┘
```

Same `DynamicCourseCard` component used on `/courses`, Drive365 home, and the whitelabel `/courses` page — identical look, identical "Book Now" flow.

## Change (single file)

Edit **`src/pages/PublicBookingPortal.tsx`** only:

1. After the existing instructor-fetch logic resolves `instructors`, also call the existing `useCourseDiscovery("all", null)` hook (already used by `/courses`).
2. Client-side filter the returned `filteredCourses` down to those whose `instructor_id` is in the set of linked Chapman's instructor IDs.
3. Render a new "Courses" section above the existing "Instructors" grid using `<DynamicCourseCard>` (same props as `WhitelabelCourses.tsx`).
4. Section header styled to match the rest of the page (uses page `brand_colour` for the heading accent line, same as the existing instructor section).
5. Empty state: if no matching courses, hide the section entirely (don't show "no courses available") — instructor cards still render below.

No new components, no DB changes, no route changes, no migration. The Chapman's booking page is already in `booking_pages` and the two instructors are already linked via `booking_page_instructors`, so no data setup is needed.

## Verify

After deploy, `/booking/chapmans` shows a Courses section with cards for the 2 linked instructors' active courses, each card linking to the existing booking flow exactly like on `/courses`.

## Notes / scope guardrails

- Mobile layout is not touched (uses the same responsive grid the cards already ship with).
- This only affects `page_type = "group"` booking pages. The existing `instructor` and `school` page types render unchanged (could extend later if you want).
- No availability filter, no postcode field — the page is already brand-scoped, so visitors see all of these instructors' active courses, mirroring the whitelabel-courses pattern.
