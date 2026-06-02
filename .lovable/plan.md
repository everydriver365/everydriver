## Goal

Replace hardcoded "4.9 (127 reviews)" and per-component review fetches with a single live source so course cards, instructor profiles/search tiles, and mini-websites all show the same rating.

## Approach

### 1. Single source of truth (DB view)

Add a Postgres view `public.instructor_rating_summary`:

- `instructor_id`
- `avg_rating` (numeric, 1 dp)
- `total_reviews` (int)
- `last_review_at` (timestamptz)

Counts only rows from `course_reviews` where `is_visible = true` and `moderation_status = 'approved'`. Grant `SELECT` to `anon` and `authenticated` (public-facing — same trust surface as the existing inline queries on mini-sites).

### 2. Shared React hook

`src/hooks/useInstructorRating.ts`:

- `useInstructorRating(instructorId)` — single instructor, returns `{ avgRating, totalReviews, lastReviewAt, isLoading }`.
- `useInstructorRatings(instructorIds[])` — batch fetch for lists (course search, directory).

Both query the view above via `supabase.from('instructor_rating_summary')`. 5-min stale time.

### 3. Display rules (consistent everywhere)

- `total_reviews >= 3` → show `★ 4.8 · 42 reviews`
- `total_reviews < 3` → show "New instructor" pill, no numeric score
- Round avg to 1 dp; render filled/half/empty stars
- Always show review count alongside the score
- No invented data; if the hook returns nothing, render the "New" state (per project Live Data rule)

### 4. Surfaces to wire

**Course cards** — replace hardcoded rating on:
- `src/components/CourseCard.tsx` (back-of-card "4.9 (127 reviews)")
- `src/components/courses/DynamicCourseCard.tsx`
- `src/components/courses/IOSCourseCard.tsx` (if it shows a rating)

**Instructor profiles / search tiles** — add a rating row under the name on:
- `InstructorTile`, `InstructorCard`, `InstructorDirectory` (whichever currently exist)
- `AccessibleInstructorProfile` — swap its inline query for the hook

**Mini-websites** — swap inline queries for the shared hook (no visible change, just consistent counts):
- `InstructorMiniWebsite`
- `mini-website/MiniWebsiteHome`
- `Reviews`
- `BookingSummary`, `PupilCourseSummary`

**School pages** (`SchoolBookingPage` + school website pages) — stop reading stale `instructors.average_rating` / `total_reviews`; use the hook instead.

### 5. Out of scope (for this change)

- Pulling Google Place ratings via edge function (can be added later as `google_avg_rating` / `google_total_reviews` columns + combined display).
- Changing the moderation workflow in `InstructorReviews.tsx`.
- Any mobile instructor-app layout changes (per project mobile-update policy).

## Technical notes

- View is read-only and depends only on `course_reviews`; no new RLS to author beyond `GRANT SELECT`.
- Hook uses React Query so all surfaces share a cache — updating a review (instructor moderation) can later `invalidateQueries(['instructor-rating', id])` for instant refresh; not wired in this pass.
- Stars rendered with `lucide-react`'s `Star` (filled + half via overlay or `fill-amber-400` partial).

## Verification

- Open a course card on the public site → see real rating (or "New instructor") instead of `4.9 (127)`.
- Open an instructor profile and the same instructor's mini-website → rating + review count match exactly.
- Submit a new approved review → after refresh, count increments on all surfaces.
- Instructor with `< 3` reviews shows "New instructor" everywhere, never a number.
