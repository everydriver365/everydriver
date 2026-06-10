# Audit results + plan

## Fix 1 — CourseGrid useMemo (already done)

`src/components/courses/CourseGrid.tsx` no longer wraps JSX in `useMemo`. The current file uses plain conditional JSX (`filteredCourses.length === 0 ? … : viewMode === "list" ? … : isMobile ? … : …`) and the only hooks are `useState` and `useCallback` at the top. `React.memo` on `DynamicCourseCard` is untouched. **No change needed.**

## Fix 2 — Google reviews on course cards

### Schema reality check
The `instructors` table and the `public_instructors` view only expose **`google_review_url`** (a link). There are **no `google_rating` or `google_review_count` columns** on either.

Live Google rating data does exist, but in a separate cache table: `public.google_place_reviews` (columns: `cache_key`, `place_id`, `place_name`, `rating`, `user_ratings_total`, `reviews`, `photo_reference`, `fetched_at`). It's populated on demand by the `fetch-google-reviews` edge function and keyed by `place_id` or a free-text query — there is **no foreign key from an instructor to a cached place**.

So the line the user wants to add — `{instructor.google_rating && instructor.google_review_count > 0 && …}` — cannot render anything today, because those fields don't exist on the course card's instructor object. This is a real schema gap, not just a UI omission.

Per the live-data-only rule (mem://constraints/no-hardcoded-fallbacks-live-data-only) we must not invent a rating, and per the project memory we shouldn't ship UI that silently no-ops either. Need a direction before editing.

### Options for surfacing Google reviews on cards

**Option A — Link only (smallest change, ship today)**
Show a small "View Google reviews" pill on `DynamicCourseCard` when `instructor.google_review_url` is present. No new columns, no new fetches. Doesn't show a star rating on the card, but it's accurate and live.

**Option B — Add cached rating/count columns + view (medium)**
1. Add `google_place_id text`, `google_rating numeric`, `google_review_count int`, `google_reviews_fetched_at timestamptz` to `public.instructors`.
2. Expose those four on the `public_instructors` view (re-create view — same pattern as the `google_review_url` migration `20260524111911`).
3. Extend `fetch-google-reviews` to also write rating/count back to `instructors` whenever it refreshes the cache, keyed by `google_place_id`.
4. Trigger a refresh (existing edge function) for instructors who have a `google_review_url` or `google_place_id` set, so the columns populate.
5. Render on `DynamicCourseCard` only when `google_review_count > 0`:
   ```
   ★ 4.8 · 42 Google reviews
   ```
   alongside the existing internal rating (already rendered via `InstructorSignalRow` / `useInstructorRating`).

**Option C — Client-side fetch per card (not recommended)**
Call `fetch-google-reviews` from each card. Slow, hammers the edge function on every search render, and breaks if Google Places key is missing. Skipping unless you really want it.

### Recommended
Option B if you want a star rating on the card. Option A if you just want a clickable Google badge today and can defer the rating work.

### What I will NOT do without your call
- Add fake/zeroed rating fields.
- Render the user-supplied snippet against non-existent columns (it would always be `undefined && … → nothing`, which is dead code).
- Touch `React.memo` on `DynamicCourseCard` or anything else in `CourseGrid`.

## Question
Which option for Fix 2 — **A (link-only pill)**, **B (add cached rating columns + view + edge-fn writeback)**, or **defer**?
