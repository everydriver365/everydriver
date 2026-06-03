## Goal
Make each course card on `/courses` show clear "this instructor is trusted" signals so learners feel safer clicking **View & Book**.

## What's already there (reusable)
The codebase already has live trust data and components — we just don't render them on the active card:

- `useInstructorRating(id)` → avg rating + total review count
- `useVerifiedProSummary(id)` → Verified Pro badge eligibility (DBS/ADI/insurance credentials, founding flag)
- `useInstructorTopReview(id)` → most recent 5★ snippet + reviewer first name
- `InstructorRatingBadge` → ★ + score chip
- `InstructorSignalRow` → ★ rating · N reviews · Verified Pro chip + optional review snippet

The course grid currently renders `DynamicCourseCard` (`src/components/DynamicCourseCard.tsx`) — and that card shows **none** of the above. The two trust-aware cards (`CourseRowCard`, variants) are not wired in.

## What to add to each course card
A compact **Trust strip** directly under the instructor name, in this order:

1. **Instructor avatar** (small, 28px round) — uses `instructor.profile_image_url`, falls back to initials.
2. **★ rating + review count** — e.g. `★ 4.9 · 127 reviews`. If under the "enough reviews" threshold, show neutral `New instructor` instead of a fake score (matches existing `hasEnoughReviews` rule and our live-data-only policy).
3. **Verified Pro chip** — only when `useVerifiedProSummary` says badge is enabled and credentials exist. Tooltip: "DBS checked · ADI registered · Insured".
4. **Years teaching** — pulled from instructor profile if available (`years_experience` / similar). Hidden if missing — no defaults.
5. **Top review snippet** (one line, italic, truncated) — only when a real review exists.

Optional secondary signal already on the card:
- Keep payment chips (Klarna / Clearpay) where they are — those are a separate kind of trust (financial).

## Empty/loading rules (live-data only)
- No rating yet → show `New instructor` chip, no stars.
- No verified credentials → hide the chip entirely (never fake).
- No review → hide snippet row entirely.
- All hooks are React Query, so they hydrate per card without blocking the grid.

## Files to change
- `src/components/DynamicCourseCard.tsx` — add the Trust strip block between the instructor row and the price/CTA block. Use the existing `InstructorSignalRow` for rating + Verified Pro + snippet so we don't duplicate logic; render the avatar inline next to it.
- No DB changes. No new hooks. No changes to search logic, filters, calendar, or other cards.

## Layout sketch
```text
┌──────────────────────────────────────────────────┐
│  [icon]  20 HOUR COURSE                          │
│          Manual · Sarah J · Eastleigh · 2.1 mi   │
│                                                  │
│   (•)  ★ 4.9 · 127 reviews   [✓ Verified Pro]    │  ← NEW trust strip
│        "Sarah got me test-ready in 3 weeks" — Tom│  ← NEW snippet
│                                                  │
│  [Fri, 6 Jun] [Klarna 3×£99]      £595  [Book →] │
└──────────────────────────────────────────────────┘
```

## Open question
Mobile card (`MobileCourseCard.tsx`) — same treatment, or keep mobile untouched per the "no mobile changes unless asked" rule? Default to **desktop card only** unless you say otherwise.
