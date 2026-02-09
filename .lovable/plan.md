

# All 5 Enhancements Implementation Plan

## 1. Wire SyllabusRecommendations into Pupil Cards

The `SyllabusRecommendations` component already exists but isn't used anywhere. It needs to be imported and rendered inside `ExpandablePupilCard.tsx`.

**Changes:**
- Import `SyllabusRecommendations` in `ExpandablePupilCard.tsx`
- Add it after the Lesson Feedback section (around line 800), inside the expanded card body, above the tool grid
- Pass `pupilId={pupil.id}` as the prop

---

## 2. Enhanced Pupil Portal Dashboard

The pupil portal (`BrandedPupilPortal.tsx`) already has a home screen with stats and navigation. We'll enhance it with:

**New component: `PupilDashboardInsights.tsx`**
- Shows AI driving insights summary (uses existing `useDrivingInsights` hook)
- Displays a mini radar chart of syllabus progress by category
- Shows latest coaching tip from AI
- Telematics score badges (speed, braking, acceleration)

**Changes to `BrandedPupilPortal.tsx`:**
- Import and add `PupilDashboardInsights` to the home section, between the stats grid and the navigation menu
- Add a new "AI Coaching" nav item that links to full insights view

**New component: `PupilAICoaching.tsx`**
- Full-page view of AI driving insights
- Overall score gauge, strengths, areas to improve, coaching tips with priority badges
- Weekly trend indicator
- Links back to specific progress skills

**Changes to `BrandedPupilPortal.tsx`:**
- Add `'coaching'` to the `ActiveSection` type
- Add navigation item for AI Coaching
- Add section rendering for the coaching view

---

## 3. Mock Theory Tests (Enhanced)

The existing `PupilPortalTheory.tsx` has a basic 5-question hardcoded quiz. We'll significantly expand it.

**New file: `src/constants/theoryQuestions.ts`**
- 50+ DVSA-style multiple choice questions across categories (road signs, rules, hazard awareness, vehicle safety)
- Each question has: question text, 4 options, correct answer index, category, explanation
- Questions are randomly selected for each test session

**Changes to `PupilPortalTheory.tsx`:**
- Replace the 5 hardcoded `SAMPLE_QUESTIONS` with random selection of 20 from the question bank
- Add category filters (Road Signs, Rules, Hazards, Vehicle Safety)
- Show correct answer and explanation after each question (instead of just moving on)
- Track best score in localStorage
- Add "Quick 10" and "Full 50" test modes
- Show post-test review of wrong answers with explanations

---

## 4. Test Day Countdown and Preparation

The existing `PupilTestInfo.tsx` already has a countdown timer and a basic 3-item checklist. We'll enhance it.

**Changes to `PupilTestInfo.tsx`:**
- Expand the checklist to include interactive checkboxes (saved in localStorage per pupil)
- Add "Show Me / Tell Me" revision section with the 19 official questions grouped by topic
- Add a "Route Familiarity" section suggesting practice routes near the test centre
- Add eyesight test practice (read a number plate at 20m reminder)
- Add "Day Before" and "Test Morning" preparation tips

**New component: `ShowMeTellMeRevision.tsx`**
- All 19 official Show Me / Tell Me questions
- Toggle to reveal answers
- Links to corresponding DVSA syllabus competency (`show_me_tell_me`)
- Track which ones the pupil has revised (localStorage)

**Changes to `BrandedPupilPortal.tsx`:**
- The `test-info` section already renders `PupilTestInfo` - no routing changes needed
- Add the new `ShowMeTellMeRevision` as a sub-section within PupilTestInfo

---

## 5. Enhanced Parent Dashboard

The existing `ParentPortal.tsx` has OTP auth, children overview, basic stats, next lesson, feedback, and activity feed. We'll add syllabus progress and payment history.

**Changes to `ParentPortal.tsx` (child detail view, lines 486-625):**
- Add syllabus progress section showing a simplified progress bar per category (Controls, Road Procedure, Junctions, Judgement, Manoeuvres, Test Ready)
- Fetch `pupil_syllabus_progress` data for the selected child
- Add payment history section showing recent payments with amounts and dates
- Add upcoming lessons list (next 5 scheduled lessons)
- Add test readiness percentage indicator

**New component: `ParentSyllabusOverview.tsx`**
- Simplified read-only view of the child's DVSA progress
- Shows progress bars per category
- Overall test readiness percentage
- No interactivity needed - just a visual overview

**New component: `ParentPaymentHistory.tsx`**
- Recent payment history for the selected child
- Shows date, amount, method
- Running balance

---

## Technical Details

### New Files
| File | Purpose |
|------|---------|
| `src/constants/theoryQuestions.ts` | 50+ DVSA theory questions bank |
| `src/components/pupil-portal/PupilDashboardInsights.tsx` | Mini insights panel for pupil home |
| `src/components/pupil-portal/PupilAICoaching.tsx` | Full AI coaching insights page |
| `src/components/pupil-portal/ShowMeTellMeRevision.tsx` | Show Me / Tell Me revision cards |
| `src/components/parent/ParentSyllabusOverview.tsx` | Parent-facing syllabus progress |
| `src/components/parent/ParentPaymentHistory.tsx` | Parent-facing payment history |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/instructor/ExpandablePupilCard.tsx` | Import + render SyllabusRecommendations |
| `src/pages/BrandedPupilPortal.tsx` | Add coaching section, dashboard insights |
| `src/components/pupil-portal/PupilPortalTheory.tsx` | Major expansion with question bank, categories, review |
| `src/components/pupil-portal/PupilTestInfo.tsx` | Interactive checklist, Show Me/Tell Me, prep tips |
| `src/pages/ParentPortal.tsx` | Add syllabus overview + payment history to child detail |

### No Database Changes Required
All data sources already exist: `pupil_syllabus_progress`, `payment_history`, `lesson_telematics`, `scheduled_lessons`. The theory questions are client-side constants. Checklist state uses localStorage.

