
# Instructor-forward Course Card — Demo Page + Variants

Build a side-by-side demo page so you can compare 3 directions on real data, pick one, and then roll it everywhere.

## 1. New demo route

Route: `/design/course-cards` (public, dev-only style, no auth required).

Picks the first ~3 real (non-placeholder) active instructors in the DB with at least one visible `instructor_courses` row, and renders each instructor through all 3 variants in a labelled column layout:

```text
┌──────── Variant A ────────┬──────── Variant B ────────┬──────── Variant C ────────┐
│  Instructor hero header   │  Split rail layout        │  One card per instructor  │
│  [card]                   │  [card]                   │  [card with hour chips]   │
│  [card]                   │  [card]                   │  [card]                   │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

Header strip explains: "Pick the direction — we'll then apply it to /courses, mini-websites, chat cards and featured courses."

## 2. The three variants

All three pull live signals: `useInstructorRating`, `useVerifiedProSummary`, and a new lightweight `useInstructorTopReview(instructorId)` hook that returns the most recent 5★ review snippet (max ~90 chars) from the reviews table. No hard-coded fallbacks — if a signal is missing, the slot is simply omitted (per LIVE DATA ONLY rule).

### Variant A — Instructor Hero Header
- Top 45% of card: brand-colour band, large avatar (64px), name, `★ rating · N reviews`, Verified Pro badge inline.
- Italic review snippet under the name (1 line, truncated).
- Bottom 55%: compact row — course name + hours + date + price + Book button.
- One card per course (current cardinality preserved).

### Variant B — Split Rail
- Left rail (~120px): avatar, name, rating stacked, Verified Pro pill, review snippet wrapped to 2 lines.
- Right side: course title, badges (Popular/Intensive/Auto), date, price, Book button.
- Horizontal card, good for desktop list view.

### Variant C — One Card Per Instructor (biggest shift)
- Header: avatar + name + rating + Verified Pro + review snippet (2 lines).
- Body: row of selectable hour chips for *all* that instructor's visible courses (e.g. `10h £400` `20h £780` `28h £1,050`). Tapping a chip routes to `/book/{id}?hours={n}`.
- Footer: "From £X" and primary "View profile" button.
- Dedupes the search feed — instead of 9 cards for SO30, you'd see 4 instructor cards.

## 3. Shared building blocks (new)

- `src/components/courses/InstructorSignalRow.tsx` — renders rating + verified pro + (optional) review snippet in a single row, used by all variants and reusable everywhere later.
- `src/hooks/useInstructorTopReview.ts` — returns `{ snippet, authorFirstName, rating } | null` from the reviews source already powering `useInstructorRating`.

These two pieces are what eventually gets dropped into the existing cards (`CourseDiscoveryCard`, `MiniWebsiteCourseCard`, `CourseChatCards`, featured courses) once you pick a direction.

## 4. Out of scope for this step

- No changes to existing production cards yet.
- No mobile-layout changes (per mobile update policy).
- No rollout to chat / mini-site / featured cards — that happens in a follow-up after you pick a variant on the demo page.

## Technical notes

- New page: `src/pages/design/CourseCardsDemo.tsx`, registered in `everydriverRoutes.tsx` at `/design/course-cards`.
- New components: `src/components/courses/variants/CourseCardHeroVariant.tsx`, `CourseCardSplitVariant.tsx`, `CourseCardInstructorVariant.tsx`.
- Data: a single query for ~3 real instructors with their visible courses, plus per-instructor `useInstructorRating`, `useVerifiedProSummary`, `useInstructorTopReview`. Top review hook reads from the existing reviews table — I'll inspect the schema before writing it and surface "no review yet" as simply no snippet rendered.
- Booking link unchanged: `/book/{instructorId}?hours={n}`.
- Styling uses existing semantic tokens; brand colour comes from `instructors.brand_colour` like today.

After you pick a variant on the demo page, the follow-up task is a small refactor: extract the chosen layout into the shared `CourseCard` and replace usages across `/courses`, mini-websites, chat cards, and featured courses.
