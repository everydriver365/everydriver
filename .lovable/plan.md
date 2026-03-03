

## Premium Placement for Paid Instructors

### Overview
Add a premium placement system where instructors on paid plans (Pro+) get boosted visibility in the learner-facing course discovery pages. Premium instructors appear first in search results with a visual "Featured" badge and highlighted card styling.

### Database Changes

**New table: `instructor_premium_placements`**
- `id` (uuid, PK)
- `instructor_id` (uuid, FK → instructors, unique)
- `is_active` (boolean, default true)
- `placement_type` (text: 'featured' | 'spotlight' | 'top_result')
- `priority_score` (integer, default 10) — higher = shown first
- `started_at` (timestamptz, default now)
- `expires_at` (timestamptz, nullable)
- `created_at` / `updated_at`

RLS: public read (learners need to see it), authenticated write restricted to the instructor's own row.

**Auto-assign via subscription tier**: Add a database trigger or handle in code — when an instructor has an active subscription on Pro/Max/Multi/Enterprise, they automatically get a premium placement row.

### Code Changes

**1. `src/hooks/useCourseDiscovery.ts`** — Sorting logic update
- Fetch `instructor_premium_placements` alongside existing queries
- In the final `.sort()`, add premium instructors first (sorted by `priority_score` desc), then non-premium sorted by existing criteria (price/nearest/soonest)
- Add `isPremium` and `placementType` fields to `CourseWithInstructor`

**2. `src/components/DynamicCourseCard.tsx`** — Desktop card
- Accept new `isPremium` prop
- When true: add a gold/amber gradient border, a "Featured" badge in top corner, subtle glow shadow
- Slightly larger card or top positioning emphasis

**3. `src/components/courses/MobileCourseCard.tsx`** — Mobile card
- Accept `isPremium` prop
- Show "Featured" badge, amber accent border on premium cards

**4. `src/components/courses/CourseGrid.tsx`** — Grid layout
- Pass `isPremium` through to card components
- Optionally render premium cards in a separate "Featured Instructors" section above the main grid

**5. Admin management** — `src/pages/admin/` area
- Add a small section in the admin instructor management to toggle premium placement and set priority for any instructor

**6. Instructor self-service** — Settings or plan page
- Show premium placement status on the instructor's plan/subscription page
- "Your listing is boosted" indicator for paid plan holders

### Files to Create
- `src/hooks/usePremiumPlacement.ts` — hook to fetch placement data

### Files to Modify
- `src/hooks/useCourseDiscovery.ts` — integrate premium sorting
- `src/components/DynamicCourseCard.tsx` — premium card styling
- `src/components/courses/MobileCourseCard.tsx` — premium mobile styling
- `src/components/courses/CourseGrid.tsx` — featured section + prop passing

