## What's actually happening

I checked the database directly:

- Richard Chapman now has **4 active rows** in `instructor_courses` — so the toggles ARE saving. The UI just isn't confirming it visibly enough, which is why it feels like "nothing happens".
- His `home_postcode` is stored as **`SO302td`** (no space, lowercase). The pupil search geocodes that string via the `geocode-postcode` edge function. Malformed postcodes often return no coordinates, so he never enters the "instructors near you" set and never appears in results.

So there are two separate bugs hiding behind one symptom.

## Fix 1 — Toggle UX: make the change obvious

In `src/components/instructor/InstructorCoursesManager.tsx`:

- Re-fetch the row from the DB after a successful insert/update so the visible state matches what's actually persisted (currently the optimistic state can drift if RLS silently filters or if the insert returned no row).
- Show a clearer toast: "Enabled — pupils can now book {course name}" / "Disabled — hidden from pupil search".
- Add a small "Visible to pupils" / "Hidden from pupils" caption under the row label that updates with the switch, so there's a non-toast confirmation too.
- Add a banner at the top of the list: "You currently offer N courses. Pupils searching your area will see these." This makes the cause/effect obvious.

No DB changes for this part — RLS policies are already correct (verified).

## Fix 2 — Auto-format postcode on save

Add a tiny helper `formatUKPostcode(input)` in `src/lib/utils.ts` (or a new `src/lib/postcode.ts`):
- Strip all whitespace, uppercase
- Insert a single space before the last 3 chars (UK outward/inward split)
- e.g. `so302td` → `SO30 2TD`, `so30 2td` → `SO30 2TD`, `SO302TD` → `SO30 2TD`

Apply it everywhere `home_postcode` is written for instructors. Based on the codebase that's:
- `src/components/instructor/InstructorProfileEditor.tsx` (or wherever instructors edit their profile — to be confirmed during implementation)
- `src/components/admin/InstructorForm.tsx` (admin-side create/edit)
- Any onboarding/signup form that captures `home_postcode`

Format on submit, not on every keystroke (so users can type freely).

### One-off data fix

Run a single UPDATE to normalise existing rows so currently-saved instructors show up immediately without needing to re-save:

```sql
UPDATE public.instructors
SET home_postcode = regexp_replace(
  upper(regexp_replace(home_postcode, '\s+', '', 'g')),
  '^(.*)(.{3})$', '\1 \2'
)
WHERE home_postcode IS NOT NULL
  AND home_postcode !~ '^[A-Z0-9]+ [A-Z0-9]{3}$';
```

This fixes Richard (`SO302td` → `SO30 2TD`) and any other instructor with a malformed postcode.

## Verification

1. Sign in as Richard, open Menu → Courses & payments → My Courses, toggle a course off then on. Confirm the new caption + toast + persisted state.
2. Open the pupil-facing course search, enter `SO30` (or a nearby postcode) and confirm Richard now appears.
3. Edit Richard's profile, type `po156aa` in the postcode field, save, and confirm it stores as `PO15 6AA`.

## Files touched

- `src/components/instructor/InstructorCoursesManager.tsx` — clearer feedback + post-save refetch
- `src/lib/postcode.ts` — new `formatUKPostcode` helper
- Instructor profile editor + `src/components/admin/InstructorForm.tsx` — call helper on save
- One data-fix SQL (via insert tool, not a migration — it's data, not schema)

No changes to RLS, the search hook, or the geocode edge function.
