## Goal
Persist every pupil mock theory test attempt to the existing `theory_mock_scores` table so scores show up in `TheoryMockScoreLogger`, the Drive365 home Theory tile, and the Test Readiness ring — replacing the current broken write to the non-existent `theory_mock_results` table.

## Current state
- `src/components/pupil-portal/TheoryMockTest.tsx` line 122 `saveResult` inserts into `theory_mock_results` cast as `any`. That table doesn't exist → inserts silently fail and nothing is shown in the portal.
- The real table `theory_mock_scores` already exists with columns: `pupil_id`, `instructor_id` (required), `score`, `total_questions`, `test_type`, `source`, `test_date`, `notes`. It's already read by `TheoryMockScoreLogger.tsx` and `Drive365PupilHome.tsx`.
- `TheoryMockTest` is rendered from `BrandedPupilPortal.tsx` line 494 with only `pupilId`; `instructor.id` is in scope on that page but not passed in.

## Changes

1. **`src/components/pupil-portal/TheoryMockTest.tsx`**
   - Add `instructorId?: string` to `TheoryMockTestProps`.
   - Rewrite `saveResult` to insert into `theory_mock_scores` with:
     - `pupil_id`, `instructor_id`
     - `score`, `total_questions: questions.length`
     - `test_type: 'full_mock'` (matches the enum used by `TheoryMockScoreLogger`)
     - `source: 'mock_test'`
     - `test_date: format(new Date(), 'yyyy-MM-dd')`
     - `notes`: JSON string of `categoryResults` + `time_taken_seconds` (preserves the category breakdown we currently capture).
   - Guard: only insert when both `pupilId` and `instructorId` are present and `questions.length > 0`. If `instructorId` is missing, log a console warning and skip — no fabricated fallback (per project Live-Data rule).
   - Toast on success/failure; remove `as any` casts and the dead `theory_mock_results` reference.

2. **`src/pages/BrandedPupilPortal.tsx`** (line ~494)
   - Pass `instructorId={instructor.id}` to `<TheoryMockTest ... />`.

3. **Test** — `src/components/pupil-portal/__tests__/TheoryMockTest.test.tsx`
   - Using the existing `src/test/supabaseMock.ts`, render `TheoryMockTest` with a pupilId + instructorId, force the results screen, and assert the mock recorded an `insert` to `theory_mock_scores` with the expected payload shape.

## Verification
- Manual: run a mock test on `/p/<slug>` → finish → confirm:
  - new row in `theory_mock_scores` via `supabase--read_query`.
  - `TheoryMockScoreLogger` updates with the new score and chart bar.
  - Drive365 Home Theory tile shows "✓ Passed · {date}" or the latest %.
- Automated: `bunx vitest run src/components/pupil-portal/__tests__/TheoryMockTest.test.tsx`.

## Out of scope
- No schema or RLS changes (table + policies already exist).
- No UI changes to the mock test screens or the home tile.
- Streak/XP wiring untouched.