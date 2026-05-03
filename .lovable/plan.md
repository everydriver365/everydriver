## Goal
Wire the "Previous lessons" section in the expanded Up next tile to show the pupil's recent completed lessons (date, time, duration, topics, notes) and open a detail modal on tap. No other screens or schemas changed.

## Data source
New hook `src/hooks/usePupilLessonHistory.ts` reading `public.lesson_history` (already exists, fully scoped to pupil, soft-deleted rows excluded):
- Select: `id, lesson_date, start_time, duration_minutes, skills_practiced, notes, rating, next_lesson_plan`
- Filter: `pupil_id = ?`, `deleted_at IS NULL`
- Order: `lesson_date DESC, start_time DESC`, limit 10
- Cached via React Query, staleTime 60s

No DB migration; no edge function; existing RLS already restricts `lesson_history` to the owning instructor.

## UI changes (only inside `src/components/instructor/UpNextExpanded.tsx`, Section 7)
Replace the current Section 7 body (lines ~921–974) with:
- Section header unchanged: `<SectionLabel>Previous lessons</SectionLabel>`
- Loading: a single shimmer row (matches iOS consistency rule)
- Empty: keep the existing dashed "View pupil history" button, unchanged
- List: up to 5 most recent rows rendered as tappable cards. Each card shows:
  - Top row: bold date (e.g. "Wed 30 Apr") + time ("9:30 AM") on the left, small "60 min" duration chip on the right
  - Middle row: up to 3 topic chips from `skills_practiced` (BLUE_TINT / BLUE), with `+N more` chip if extra
  - Bottom row: 1-line truncated notes preview in MUTED, only if notes present
  - 5-star rating badge on the right of the date row when `rating` not null
- Below the list: a small text-only "View all lessons →" link that routes to `/instructor/pupils/${pupilId}` (existing route used by the empty-state button)

All inline styles reuse existing tokens (`BLUE`, `BLUE_TINT`, `CHARCOAL`, `MUTED`, `ROW_BORDER`, `BORDER`, radius 12). No Tailwind. Match font/size patterns of the surrounding sections.

## Modal
New file `src/components/instructor/PreviousLessonModal.tsx`:
- Uses existing shadcn `Dialog` from `@/components/ui/dialog`
- Props: `open`, `onOpenChange`, `lesson: PupilLessonHistoryEntry`, `pupilName`
- Sections inside the dialog:
  1. Header: pupil name + formatted full date/time + duration
  2. Rating (stars) if present
  3. Topics covered: full list of `skills_practiced` as wrapping chips
  4. Notes: full `notes` block, whitespace-pre-wrap
  5. Plan for next lesson: `next_lesson_plan` if present, in a tinted card
  6. Footer button: "Open pupil profile" → `/instructor/pupils/${pupilId}` (closes modal)
- Sized for mobile (max-width ~420px, scrollable body)

`UpNextExpanded` keeps a local `selectedLesson` state; tapping a card sets it; the modal renders only when set. No prop drilling required.

## Out of scope
- No changes to collapsed tile, map hero, OBD section, fault codes section, or any other screen
- No edits to `MobileHomeRedesign` (no new props)
- No schema changes
- The existing `lastLessonPlan` prop becomes redundant for this section but is left intact (still passed in by parent) — we just stop rendering it here in favour of the live list

## Files
- Add `src/hooks/usePupilLessonHistory.ts`
- Add `src/components/instructor/PreviousLessonModal.tsx`
- Edit `src/components/instructor/UpNextExpanded.tsx` (Section 7 only + small imports + selectedLesson state)
