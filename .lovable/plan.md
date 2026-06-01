## Goal

Add a **Theory Test** tile to the instructor's pupil profile (`PremiumPupilProfile.tsx`) that renders one of four states from live DB data, and add inputs in `EditPupilSheet` so the instructor can set those fields.

## Tile states

```
┌──────────────────────────────────────────────┐
│ Theory test                                  │
│ ─────────────────────────────────────────────│
│ ✓ Passed            12 Mar 2026   (green)    │   ← theory_test_passed = true
│ ✕ Not passed        last attempt 12 Mar      │   ← theory_test_passed = false
│ 📅 Booked            14 Jul 2026 · Southampton│  ← passed null + future date
│ + Add theory test                            │   ← no data
└──────────────────────────────────────────────┘
```

Logic:
- `theory_test_passed = true` → "Passed" + `theory_test_date` (green/check).
- `theory_test_passed = false` → "Not passed" + `theory_test_date` if present (amber/red).
- `theory_test_passed IS NULL` AND `theory_test_date >= today` → "Booked" + date + centre name from `theory_test_centres`.
- Nothing set → empty CTA that opens the EditPupilSheet on the Theory section.

Tile placement: directly below the existing "Test readiness" / "Next lesson" cluster, before `LastLesson`, matching the existing `Card` styling.

## DB changes

1. **New table `public.theory_test_centres`** — UK Pearson VUE theory centres:
   - `id uuid pk default gen_random_uuid()`
   - `name text not null`
   - `address text`, `postcode text`
   - `lat numeric`, `lng numeric`
   - `is_active boolean not null default true`
   - `created_at timestamptz default now()`
   - Grants: `SELECT` to `anon, authenticated`; `ALL` to `service_role`. RLS on, policy "Anyone can view active theory centres" `USING (is_active = true)`.

2. **Add column** `pupils.theory_test_centre_id uuid` referencing `public.theory_test_centres(id) ON DELETE SET NULL`. No other pupil schema changes — `theory_test_date`, `theory_test_passed`, `theory_cert_number` already exist.

3. **Seed** a starter set of major UK theory test centres (London, Manchester, Birmingham, Southampton, Bristol, Leeds, Glasgow, Cardiff, Newcastle, Liverpool, Sheffield, Nottingham, etc. — ~30 rows) via a follow-up `insert` call. List can be expanded later.

## Frontend changes

`src/pages/PremiumPupilProfile.tsx`:
- Add a query `["theory-centre", pupil.theory_test_centre_id]` (only when id present) returning `name, postcode` from `theory_test_centres`.
- Add `TheoryTest` `Card` block with the four-state rendering above. Tap → opens `EditPupilSheet` (re-use existing `editOpen` state).
- Use existing colour tokens: green=`C.green`, amber=`C.amber`, accent=`C.accent`, muted=`C.muted`. Icons: `GraduationCap`, `Check`, `X`, `Calendar`.

`src/components/instructor/EditPupilSheet.tsx`:
- New section "Theory test" with:
  - **Status** select: Not taken / Booked / Passed / Not passed.
  - **Date** input (`type=date`) — labelled "Test date" or "Date booked" depending on status.
  - **Theory centre** searchable Select populated from `theory_test_centres` (visible when status = Booked or Passed).
  - **Certificate number** text input (visible when status = Passed) — maps to existing `theory_cert_number`.
- Save mapping: Status drives `theory_test_passed` (`true` / `false` / `null`), date → `theory_test_date`, centre → `theory_test_centre_id`, cert → `theory_cert_number`.

## Out of scope

- No changes to pupil portal, parent portal, instructor dashboard tiles, or syllabus hub.
- No changes to practical-test logic, `test_centres`, `test_centre_id`, or EOL flow.
- No realtime; tile refetches on the existing pupil-profile invalidation key after edit.
- No new admin UI for managing the centre list (seed via migration / insert tool only).

## Technical notes

- The `pupils` row already comes back from `usePupil` — no schema-altering refactor needed; just one extra optional select to fetch centre name when `theory_test_centre_id` is set.
- TS types regenerate automatically after the migration; no manual edits to `src/integrations/supabase/types.ts`.
