## Replace MTD tile with "Course & Loyalty Bonus" live counter

### Scope (mobile instructor home → "At a glance" section)

Swap the `MTDDeadlineTile` for a new `CourseBonusTile` at `src/components/instructor/MobileHomeDSM2026.tsx:429`. MTD tile component stays in repo unused (still referenced from the MTD pages elsewhere).

### New component: `src/components/instructor/CourseBonusTile.tsx`

Live counter sourced from `public.pupils` for the current instructor:

- Query: `select id from pupils where instructor_id = <id> and course_status = 'completed' and deleted_at is null`
- `count = rows.length`; `total = count * 50`
- Realtime: subscribe to `postgres_changes` on `public.pupils` filtered by `instructor_id=eq.<id>` → refetch on any insert/update/delete (catches `course_status` flipping to `completed`).
- Uses `TileCard` to match the rest of the "At a glance" tiles.
- Layout: eyebrow "COURSE & LOYALTY BONUS", big value `£{total}` (e.g. `£250`), subtitle `{count} course{s} completed · £50 each`. Tap → navigate to `/instructor/payments?tab=bonus` (existing route used by the "Referrals" quick-access tile).
- Loading skeleton + empty state ("No bonuses yet — complete a course to earn £50").

### Edit

- `src/components/instructor/MobileHomeDSM2026.tsx`:
  - Replace `import { MTDDeadlineTile } …` with `import { CourseBonusTile } …`
  - Replace `<MTDDeadlineTile instructorId={instructorId} />` with `<CourseBonusTile instructorId={instructorId} />`

### Out of scope

- No DB changes — `course_status='completed'` and the `award_course_completion_bonus` RPC already exist.
- MTD tile is only removed from the mobile home "At a glance"; MTD dashboard/setup routes are untouched.