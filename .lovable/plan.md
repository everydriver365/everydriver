## Problem

On the homepage "Featured instructors" tile, Ken D's card shows no review even though he has 5 visible / approved course reviews in the database (5.0 avg). Same latent bug affects Sarah M.

## Root cause

In `src/components/homepage/FeaturedInstructors.tsx`, the most-recent-review fetch runs against the wrong list of ids:

- `const real = scored.filter(i => !i.isPlaceholder)` is computed **before** the final list is assembled.
- Right after, placeholders (Richard, Ken D, Sarah M) are hydrated from the DB via `matchSlug` and pushed into `finalList`. After hydration they have real DB ids and `isPlaceholder: false`.
- `scored` is replaced with `finalList`, but the review fetch still uses the stale `realIds` derived from the old `real` array. Ken D's / Sarah M's real ids are missing, so no `course_reviews` rows are pulled and `i.review` stays undefined.

Richard masks the bug because his placeholder has a `googleQuery`, so the separate Google-reviews effect fills his card.

## Fix

Move the review-fetch step to **after** `scored` is replaced with `finalList`, and rebuild the id list from the final scored array:

```ts
// after finalList is pushed into `scored`
const realIds = scored.filter(i => !i.isPlaceholder).map(s => s.id);
if (realIds.length > 0) {
  const { data: reviews } = await supabase
    .from("course_reviews")
    .select("instructor_id, review_text, reviewer_name, passed_first_time, created_at")
    .in("instructor_id", realIds)
    .eq("is_visible", true)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });
  const reviewMap = new Map<string, ReviewRow>();
  for (const r of (reviews ?? []) as ReviewRow[]) {
    if (!reviewMap.has(r.instructor_id)) reviewMap.set(r.instructor_id, r);
  }
  for (const i of scored) i.review = reviewMap.get(i.id);
}
```

No DB / schema changes. Only the review-fetch block (currently lines ~285–300) moves and uses the post-hydration list.

## Verification

After the change, Ken D's card should render his latest approved review (most recent reviewer in DB: "Verified Buyer", 2026-06-05). Richard's existing Google-reviews behaviour is unaffected. Sarah M's card will also surface her latest review if one exists.
