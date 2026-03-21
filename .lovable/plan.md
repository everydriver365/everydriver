

## Plan: Brake Pedal & Reverse Gear Pupil Driving Pattern Analysis

### Current State
- Brake pedal position and gear data are already in the Geotab `DIAGNOSTIC_MAP` and fetchable via `geotab-status-data`
- But they're only shown as **live sensor gauges** — not tied to individual pupil lessons or used for pattern analysis
- The `PupilDrivingReport` and `generate-driving-insights` edge function only analyse speed, harsh braking (from G-force), and acceleration — not pedal/gear data

### What This Adds

1. **Per-lesson brake & gear metrics** — during Geotab-tracked lessons, poll brake pedal % and gear position alongside existing GPS data
2. **Pupil pattern cards** — show brake smoothness score, reverse manoeuvre count/duration, and gear change frequency per session
3. **Integration into driving insights** — feed brake/gear patterns into the AI coaching engine

---

### Stream 1: Store Brake & Gear Data Per Lesson

**File**: `supabase/functions/geotab-poller/index.ts`

During active lesson polling, add StatusData requests for `DiagnosticBrakePedalPositionId` and `DiagnosticTransmissionCurrentGearId` alongside existing GPS polling. Store results in a new lightweight table.

**Migration**: Create `lesson_pedal_data` table:
```sql
CREATE TABLE public.lesson_pedal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE CASCADE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  brake_pedal_pct NUMERIC,
  gear_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Index for fast per-session queries
CREATE INDEX idx_lesson_pedal_telematics ON public.lesson_pedal_data(telematics_id, recorded_at);
-- RLS
ALTER TABLE public.lesson_pedal_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instructors see own" ON public.lesson_pedal_data FOR SELECT TO authenticated
  USING (telematics_id IN (
    SELECT id FROM public.lesson_telematics WHERE instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  ));
```

### Stream 2: New Hook for Pedal/Gear Analysis

**New file**: `src/hooks/useLessonPedalData.ts`

Fetches `lesson_pedal_data` for a telematics session and computes:
- **Brake smoothness score** (0–100): penalises sudden jumps from 0→80%+, rewards gradual pedal application
- **Reverse manoeuvre count**: consecutive readings where gear = -1
- **Average reverse duration**: time spent in reverse per manoeuvre
- **Gear change frequency**: changes per km driven

### Stream 3: Pupil Driving Pattern Card

**New file**: `src/components/instructor/PupilBrakeGearAnalysis.tsx`

A card component showing per-session analysis:
- Brake smoothness gauge (circular progress)
- Brake pedal timeline chart (small sparkline of pedal % over time)
- Reverse manoeuvres list with duration
- Gear usage distribution (pie/bar: time in each gear)

Integrated into `PupilDrivingReport.tsx` as a new tab alongside existing "Route Map" and "Events" tabs.

### Stream 4: Feed into AI Coaching

**File**: `supabase/functions/generate-driving-insights/index.ts`

Add a query for `lesson_pedal_data` aggregates and include in the prompt context:
- "Pupil applied brakes harshly (0→90%) 4 times in last 3 sessions"
- "Pupil spent average 45 seconds per reverse manoeuvre (improving from 60s)"
- This enriches the coaching tips with pedal/gear-specific advice

### Stream 5: Poller Integration

**File**: `supabase/functions/geotab-poller/index.ts`

In the main polling loop (where GPS points are fetched), add a parallel `StatusData` call for brake pedal and gear. Insert results into `lesson_pedal_data` with the same `telematics_id`.

### Files Summary

| Action | File |
|--------|------|
| Migration | `lesson_pedal_data` table with RLS |
| Edit | `supabase/functions/geotab-poller/index.ts` — poll brake/gear during lessons |
| Create | `src/hooks/useLessonPedalData.ts` — fetch + compute metrics |
| Create | `src/components/instructor/PupilBrakeGearAnalysis.tsx` — analysis card |
| Edit | `src/components/instructor/PupilDrivingReport.tsx` — add Brake & Gear tab |
| Edit | `supabase/functions/generate-driving-insights/index.ts` — include pedal/gear in AI context |

