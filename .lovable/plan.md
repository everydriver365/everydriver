

## Fix: Make Pupil Journey Timeline Use Real Data

**Problem**: The pupil portal's "Your Journey" timeline uses static fields from the `pupils` table (`lessons_completed`, `progress`) and has `hasTestDate` hardcoded to `false`. It doesn't reflect actual lesson history, theory test status, or practical test bookings.

### Changes

1. **`src/components/pupil-portal/PupilJourneyTimeline.tsx`** — Rewrite to query real data like the admin version does:
   - Accept `pupilId` and `instructorId` props instead of pre-computed numbers
   - Query `scheduled_lessons` for actual completed lesson count and first lesson date
   - Query `lesson_history` as a fallback for completed lessons
   - Read `theory_test_date` / `theory_test_passed` from the `pupils` table
   - Read `test_date` from the `pupils` table for practical test booking
   - Optionally query `driving_test_results` for pass/fail status
   - Build milestones from real data (similar pattern to `src/components/admin/PupilJourneyTimeline.tsx`)

2. **`src/pages/BrandedPupilPortal.tsx`** — Update the props passed:
   - Replace `lessonsCompleted`, `progress`, `hasTestDate` with `pupilId={pupil.id}` and `instructorId={instructor.id}`
   - The component will fetch its own data internally

### Milestone Structure (from real data)
- **Registered** — always completed (pupil exists)
- **First Lesson** — check if any completed lesson exists in `scheduled_lessons` or `lesson_history`
- **Theory Test** — check `pupils.theory_test_date` and `pupils.theory_test_passed`
- **Practical Test Booked** — check `pupils.test_date`
- **Practical Test Result** — check `driving_test_results` for pass/fail

This mirrors the admin timeline's data approach while keeping the pupil portal's brand-aware visual style.

