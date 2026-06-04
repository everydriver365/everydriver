## Goal

Add a new "What our pupils say" section to the homepage, directly below the "See who's teaching you" block. Pull live data from the existing `course_reviews` table, falling back to placeholder copy only when no approved reviews exist. The existing "Learner stories" block stays where it is (keep both, per your choice).

## Step 1 — Schema migration

Extend `public.course_reviews` with the two fields the spec needs:

- `reviewer_location text` — nullable, e.g. "Winchester"
- `passed_first_time boolean` — nullable, drives the green badge

No data backfill (existing 5 rows stay null; badge/location simply hide when null). Types file regenerates automatically.

## Step 2 — New component

Create `src/components/home/PupilReviewsSection.tsx`:

- Container: `#F3F4F6`, padding `48px 40px`, full-width section.
- Header (flex, space-between, align-end):
  - Left: orange eyebrow "WHAT OUR PUPILS SAY" + heading "Real reviews. Real results." (exact sizes/weights/colors from spec).
  - Right: ★★★★★ in `#FBBF24` + "4.9" + "2,400+ reviews" (static aggregate, matches spec).
- Grid: 3 columns, 12px gap. Each card: white, 10px radius, 16px padding, `#E5E7EB` border, stars row, review text, footer with name + `location · formatted month-year date`, and conditional green "✓ Passed 1st time" pill.
- Instructor row (only if `instructor_id` resolves): 18px circle avatar with initials on `#0A2B6B`, then `Instructor: {name} · {pass_rate}% pass rate` (pass rate from `instructors.pass_rate` if present, otherwise omit the percentage segment — never invent a value, per the live-data-only memory rule).

### Data fetch

In the same component, query Supabase on mount:

```ts
supabase
  .from('course_reviews')
  .select('id, reviewer_name, review_text, review_date, reviewer_location, passed_first_time, instructor_id, instructors(first_name, last_name, pass_rate)')
  .eq('moderation_status', 'approved')
  .eq('is_visible', true)
  .order('review_date', { ascending: false })
  .limit(3)
```

If the result is empty → render the 3 placeholder cards from the spec (Sarah M / Jake T / Emma R). Otherwise render the live rows. Loading state: render nothing (no flash) until query resolves.

## Step 3 — Wire into the page

Edit `src/components/home/Drive365Home.tsx`: import `PupilReviewsSection` and render `<PupilReviewsSection />` immediately after `<SeeWhoIsTeaching />` on line 479, before the Learning paths section. No other changes to this file or any other page/component.

## Constraints honoured

- Pull live where available, placeholders only when empty.
- Approved-only filter (`moderation_status = 'approved' AND is_visible = true`).
- Badge & instructor row are strictly conditional — never hardcoded for live rows.
- Light mode only; no token system used since this section is fully self-styled per spec.
- No edits to any other section/page/component.

## Files touched

- New migration: add `reviewer_location`, `passed_first_time` to `course_reviews`.
- New: `src/components/home/PupilReviewsSection.tsx`.
- Edited: `src/components/home/Drive365Home.tsx` (1 import + 1 line render).
