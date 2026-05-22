## Short answer: yes, and most of it is already built

A full DVSA syllabus tracker is already wired into the project across all three portals. Before adding anything new, the right move is to audit what's live, fix any gaps, then layer on the "what's next" coaching piece if it isn't already strong enough.

## What already exists

**Shared data layer**
- `src/constants/dvsaSyllabus.ts` — 27 official DVSA competencies grouped into 6 categories (Controls, Road Procedure, Junctions, Judgement, Manoeuvres, Test Ready), plus a 0–5 skill-level scale (Not Started → Independent)
- `pupil_syllabus_progress` table — stores `competency_id`, `level`, `instructor_notes`, `updated_at` per pupil

**Instructor portal**
- `DrivingSyllabus.tsx` — full grid editor to set skill level per competency
- `SyllabusBuilder.tsx`, `CompetencyPicker.tsx` — lesson planning around competencies
- `SyllabusProgressChart.tsx` — radar chart of category coverage
- `SyllabusRecommendations.tsx` — "Needs attention / Ready to progress / Not yet started / Test ready" bucketing
- `StepSkills.tsx` (end-of-lesson flow) — instructor logs what was covered after each lesson
- `TestReadinessScore.tsx`, `PupilProgressionTracker.tsx`

**Pupil portal**
- `PupilSyllabusView.tsx` — pupil-facing skills list
- `PupilDashboardRadar.tsx` — radar chart on dashboard
- `ProgressDashboard.tsx`, `PupilPortalProgress.tsx`, `TestReadinessCard.tsx`

**Parent portal**
- `ParentSyllabusOverview.tsx` — per-child category bars, % test ready, PDF export

## What's likely missing or weak

Without running the audit I can't be certain, but typical gaps for a system this size are:
1. **"What's next" suggestions** — the instructor sees recommendations, but the pupil/parent may not see a clear *next lesson focus*
2. **Visibility on the mobile instructor home** — no syllabus tile in `MobileHomeDSM2026`
3. **Timeline / history** — competencies have `updated_at` but no per-competency log of when each level changed
4. **Auto-logging** — `StepSkills` may not be reliably triggering from every lesson-end path
5. **Parent notifications** when a child masters a new skill

## Proposed plan

**Phase 1 — Audit (no code changes)**
Open each of the three portals and confirm:
- Instructor: syllabus editor reachable from pupil profile, end-of-lesson StepSkills fires, recommendations show
- Pupil: radar + skills list + test readiness all load with live data
- Parent: per-child syllabus overview loads and PDF exports

**Phase 2 — Fill the most useful gap: "Next focus"**
Add a single shared component `NextSyllabusFocus` that picks the 3 highest-priority competencies (lowest level, weighted by category coverage gap) and renders it:
- On the pupil portal home (above test readiness)
- On the parent child-detail page
- On the instructor pupil card / lesson prep card

**Phase 3 — Mobile instructor surfacing (optional)**
Add a compact "Syllabus" quick-tile to `MobileHomeDSM2026` linking to the per-pupil syllabus editor, since you've been iterating on that screen.

**Phase 4 — History trail (optional, schema change)**
New `pupil_syllabus_progress_history` table that logs every level change with timestamp + instructor_id, so pupils/parents can see a timeline of "you levelled up Roundabouts on 12 May".

### Recommendation
Start with Phase 1 + Phase 2. Phase 2 is a single new component reused in 3 places, no schema change, and directly answers your "what's next to do" question. Phase 3 and 4 only if you want them after seeing Phase 2.

Want me to proceed with Phase 1 + 2, or go wider?