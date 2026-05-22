# Plan — Lesson note sharing + Tax estimate tile

## PART 1 — Findings & migrations

### Where instructor freeform notes live
- Captured in `EndLessonWizard.tsx` state `notes`, edited via `StepSummary.tsx` (textarea + dictation through `useVoiceRecognition`).
- Persisted in `EndLessonWizard.handleDone()` into **`lesson_history.notes`** (text). The audio blob, if any, goes to storage bucket `voice-notes` and the path lands in **`lesson_history.voice_note_url`**.
- `VoiceLessonNotes.tsx` (standalone) is currently only imported in itself — not mounted in the live wizard. So the only live source we need to surface is `lesson_history.notes` (+ optional `voice_note_url`).

### Where to store the share toggle
- `instructors` table already holds the sibling toggles `lesson_feedback_enabled` and `reflective_logs_enabled`, and `BrandedPupilPortal` already selects those from `instructors`. The natural home for the new toggle is the same table.
- `instructor_feature_toggles` exists but is used for feature-flag UX toggles (AI briefing, harsh-event heatmap, etc.), not pupil-visible sharing rules — wrong table.

### Migration (only one needed)
```sql
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS share_lesson_notes_with_pupil boolean NOT NULL DEFAULT false;
```
- No new RLS needed: column lives on a row the instructor already owns and pupils already read via the existing `instructors` select used in `BrandedPupilPortal`.
- No backfill required (defaults to off for everyone — additive, no behaviour change for existing pupils).

### Tax-tile data source
- `InstructorTax.tsx` calculates inline (no shared hook). To honour "do not modify InstructorTax.tsx" and avoid duplicating logic, extract a new **headline-only** hook `useInstructorTaxSummary(instructorId)` that runs the same three queries (`payment_history` positives, `instructor_expenses`, `mileage_logs` business) and returns `{ totalIncome, totalExpenses, taxableIncome, estimatedTax, estimatedNI, totalLiability, taxYear, monthsRemaining, loading, hasAnyPayments }`. It does **not** compute the category breakdown.
- `InstructorTax.tsx` is untouched. Future refactor (out of scope) could rewire it onto the hook.

### Tax page gate
- `/instructor/tax` is wrapped in `<Gated feature="expense_tracking">` in `instructorPortalRoutes.tsx`. The tile renders for everyone, but when `expense_tracking` is off the tile shows a "Set up tax tracking" CTA that links to `/instructor/tax` (the gate page itself handles the upsell).

---

## PART 2 — Task 1: Lesson notes visible to pupils/parents

### 2.1 Migration
Apply the `share_lesson_notes_with_pupil` migration above.

### 2.2 Instructor settings toggle
File: existing instructor settings page that already exposes `lesson_feedback_enabled` / `reflective_logs_enabled` toggles (likely `src/components/instructor/FeatureTogglesSettings.tsx` — to be confirmed at build time by grepping for `reflective_logs_enabled`).

Add a new "Lesson notes" section with one switch:
- Label: **Share your lesson notes with pupils after each lesson**
- Sub-label: *Pupils (and their parent, if linked) can read the note you wrote at the end of the lesson. Off by default.*
- Writes to `instructors.share_lesson_notes_with_pupil` for the current instructor.

### 2.3 Pupil surface
In `BrandedPupilPortal.tsx` and `PupilPortal.tsx`:
1. Add `share_lesson_notes_with_pupil` to the `instructors` select.
2. New read-only component `src/components/pupil-portal/InstructorLessonNotes.tsx`:
   - Props: `pupilId`, `instructorId`, `shareEnabled`, optional `brandColour`.
   - Early-returns `null` when `shareEnabled !== true`.
   - Queries `lesson_history` rows for that pupil where `notes` is non-empty, ordered desc, limit ~10. Shows a card per lesson: date + duration + the note text. If `voice_note_url` is present, render an `<audio>` element using a signed URL from the `voice-notes` bucket (read-only playback).
   - If the query returns zero rows: render nothing (no empty state — per spec).
3. Mount the component beneath the existing `<ReflectiveLog>` block on both portals. No changes to `ReflectiveLog`, `PupilFeedbackPrompt`, `PupilEndOfLessonWizard`, `PostLessonRating`.

### 2.4 Parent surface
In `src/components/parent/ParentLessonNotes.tsx`:
- Extend the existing query (which already joins `lesson_feedback`) to also pull `lesson_history.notes` and `voice_note_url` for the pupil's instructor.
- Read `instructors.share_lesson_notes_with_pupil` for that instructor; when true, render an "Instructor's note" block beneath the existing feedback row. When false or note is empty, render nothing extra.

### 2.5 Storage access (voice notes)
The `voice-notes` bucket is currently written by the instructor only. To allow pupil/parent playback when sharing is on, add a storage policy gating read on:
- `bucket_id = 'voice-notes'` AND the requesting user owns a `pupils` row whose `instructor_id` matches the leading folder of `name` (path format `{instructorId}/...`) AND that instructor's `share_lesson_notes_with_pupil = true`.

(Plain-text notes are already covered by existing `lesson_history` RLS the pupil uses elsewhere; if that policy does not yet permit pupil read of their own `lesson_history` rows, the migration step adds a `SELECT` policy: pupil can read rows where `pupil_id = current pupil id resolved from auth` AND the instructor has sharing on.)

### Hard constraints honoured
- No edit to `EndLessonWizard` step logic or order.
- No edit to `VoiceLessonNotes` recording behaviour.
- No edit to `lesson_feedback`, `lesson_ratings`, `reflective_logs` logic.
- Toggle defaults to false → zero behavioural change for existing pupils/parents until instructor opts in.

---

## PART 3 — Task 2: Tax estimate tile

### 3.1 New hook
`src/hooks/useInstructorTaxSummary.ts` — runs the same 3 queries as `InstructorTax.tsx` (payment_history positives, instructor_expenses sum, mileage_logs business → 45p/25p HMRC allowance), returns headline figures plus:
- `taxYear` string `"2025/26"` (current UK tax year, Apr 6 → Apr 5).
- `monthsRemaining` integer (rounded down) to the next 5 April.
- `hasAnyPayments` boolean — true only if at least one positive `payment_history` row exists in this tax year.
- Reuses the same `calculateTax` / `calculateNI` helpers — extract them into `src/lib/ukTax.ts` and re-import from `InstructorTax.tsx` (no behavioural change in `InstructorTax.tsx` — pure extraction). If "do not modify InstructorTax.tsx" is read strictly, duplicate the two pure functions into `ukTax.ts` instead and leave `InstructorTax.tsx` byte-identical.

### 3.2 Tile component
`src/components/instructor/TaxEstimateTile.tsx`:
- Card: white bg, `border` `#e0e3ea`, radius 14, Poppins (matches existing dashboard tiles).
- Eyebrow row: `TAX ESTIMATE` (10px uppercase, grey) left · tax year right.
- Headline: `formatCurrencyCompact(totalLiability)` — 28px bold charcoal.
- Subtitle: `Estimated tax + NI` (11px grey).
- Progress bar: tax-year progress, track `#F2F4F8`, fill `#2952b3`, caption `{monthsRemaining} months remaining`.
- 2-col grid: Income tax (£X, blue) | National Insurance (£X, grey).
- Whole tile is a button → `navigate("/instructor/tax")`.
- Loading: skeleton (shimmer matching existing dashboard tiles).
- When `expense_tracking` feature flag is off (check via existing feature-toggle hook), render the same shell with title "Tax estimate" and a single "Set up tax tracking" CTA in place of the figures.

### 3.3 Mount
- Instructor home is `/instructor` → `src/pages/InstructorPortal.tsx`.
- Locate the home composition (likely `CleanHomeView.tsx` / `AppStyleHomeView.tsx` / `CompactHomeView.tsx` — confirm at build time by finding which is rendered for the live `/instructor` route).
- Insert `<TaxEstimateTile />` after the earnings section and before the schedule section.
- Render only when `hasAnyPayments === true`. Brand-new instructors with zero income this tax year see nothing — no skeleton, no empty state.

### Hard constraints honoured
- `InstructorTax.tsx` untouched (pure-function extraction is optional — if disallowed, duplicate the two helpers).
- `EndLessonWizard` and note-capture logic untouched.
- Tile is read-only, single tap navigates to existing page.
- All calculation lives in the new shared hook; no duplicated business logic on the dashboard.

---

## PART 4 — Verification checklist (post-build)
1. Migration applies cleanly; `instructors.share_lesson_notes_with_pupil` defaults to false for all existing rows.
2. With toggle off: pupil portal & parent portal show no visible change (diff only the new component import is dead-coded).
3. With toggle on and a `lesson_history.notes` row present: pupil sees the "Instructor's note" card; parent sees the note alongside `lesson_feedback`.
4. With toggle on but no notes for any lesson: nothing rendered.
5. `InstructorTax.tsx` figures unchanged (regression smoke test on a known instructor).
6. Tax tile on `/instructor`: matches values shown on `/instructor/tax` for the same instructor & tax year, navigates correctly, hides for instructors with zero positive payments this tax year.
7. With `expense_tracking` feature off: tile shows the CTA variant, not figures.

---

## PART 5 — Deferred / out of scope
- Refactoring `InstructorTax.tsx` onto the new hook (kept untouched per spec).
- Retiring the standalone `VoiceLessonNotes.tsx` (not mounted in the live wizard — leave as-is).
- Surfacing instructor notes on the instructor-side pupil profile (already covered by `PupilReflectiveLogs` / `LessonHistory`).
- Adding a desktop-specific layout variant of the tax tile (mobile-first per project policy; desktop will inherit until explicitly asked).
- Compact dashboard tile for MTD quarter-deadline status — separate request.

Approve and I'll implement in this order: migration → toggle UI → pupil/parent surfaces → tax hook → tile → mount.
