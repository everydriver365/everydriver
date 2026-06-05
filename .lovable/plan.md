## Problem

Richard Chapman is a real, active instructor in the database:
- slug `richard-chapman`, £60/hr, real profile photo, 4 active bookable courses
- BUT he has **0 reviews in the CRM** (`course_reviews` / `instructor_rating_summary` is empty)

The featured-instructors filter requires `total_reviews >= 5 AND avg_rating >= 4.5`, so he gets filtered out and falls into the **placeholder** branch — which renders "Joining soon →" / "Coming soon" and a non-clickable card. That's wrong: he has a profile page and bookable courses.

## Fix

Treat Richard as a real, bookable card whose **social proof comes from Google** instead of from the CRM.

### Changes to `src/components/homepage/FeaturedInstructors.tsx`

1. **Add an explicit "Google-backed featured" override**

   Extend the placeholder entries with an optional `matchSlug`:
   ```ts
   { id: "richard-chapman", name: "Richard Chapman", matchSlug: "richard-chapman",
     googleQuery: "Chapman's Driving School Winchester", ... }
   ```

2. **Resolve the override against the DB on load**

   After loading `public_instructors`, for each placeholder with `matchSlug`:
   - look up the real instructor row by `app_slug`
   - if found, build a card that uses the **real** `id`, `app_slug`, `profile_image_url`, `hourly_rate`, `home_postcode`
   - mark it `isPlaceholder: false`, but flag it `googleBacked: true` so the render path knows to use Google reviews instead of CRM reviews

3. **New render variant: `googleBacked`**

   - Header avatar uses the real `profile_image_url` (already in DB), falls back to the Google business photo if missing
   - Badge: "⭐ Verified on Google" (blue)
   - Stats row: Google rating + Google review count (+ pass rate if available)
   - Quote block: top Google review
   - Button: real **"View profile →"** linking to `/p/richard-chapman` — same styling as real instructors, not the greyed-out "Joining soon"

4. **Slot order**

   Keep Richard pinned to the top slot (slot 0, orange accent), then real CRM-qualified instructors, then any remaining true placeholders (Ken D) fill the tail.

5. **Ken D unchanged** — he stays a true placeholder ("Coming soon") until he has either a real account or Google data.

## Out of scope

- No DB changes
- No edge function changes (the existing `fetch-google-reviews` + `google-place-photo` keep working)
- No changes to other instructors, sections, or pages
