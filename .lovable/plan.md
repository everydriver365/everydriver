

## Plan: "Prefer Earliest Slot" Instructor Setting

### What It Does
When enabled, the booking system presents available time slots to pupils in earliest-first order and highlights the earliest slot as "Recommended". This keeps the instructor's day compact by filling morning gaps first rather than letting pupils pick late-afternoon slots that create a disjointed schedule.

### Changes

#### 1. Database Migration
Add a boolean column to `instructors`:
```sql
ALTER TABLE public.instructors 
ADD COLUMN prefer_earliest_slot boolean NOT NULL DEFAULT false;
```

#### 2. Feature Toggle (FeatureTogglesSettings.tsx)
Add a new entry to the `featureToggles` array:
```
key: "prefer_earliest_slot"
label: "Earliest Slot Priority"
description: "Offer pupils the earliest available slot first to keep your day compact and avoid gaps"
defaultValue: false
```

#### 3. LessonScheduler.tsx — Slot Ordering & Recommendation
- Fetch `prefer_earliest_slot` from the instructor record alongside availability data
- When enabled:
  - Sort `getAvailableTimeSlots()` results earliest-first (already natural order, but add a visual "Recommended" badge on the first slot)
  - Auto-scroll to / highlight the earliest available slot when a date is selected
  - Show a small banner: "Your instructor prefers earlier lesson times"

#### 4. AutoSchedulePreview / autoScheduler.ts — Scoring Boost
- Pass `prefer_earliest_slot` into `findOptimalSlots`
- When enabled, add a score bonus to earlier time slots (e.g., +10 for morning, +5 for early afternoon) so the auto-scheduler naturally selects earlier times

#### 5. StepBookNext.tsx — End-of-Lesson Quick Book
- When `prefer_earliest_slot` is true, sort the candidate times so earliest available slots appear first (already the default order, but skip later slots if earlier ones exist on the same day)

### Files Modified
| File | Change |
|------|--------|
| Migration | Add `prefer_earliest_slot` column |
| `FeatureTogglesSettings.tsx` | Add toggle entry |
| `LessonScheduler.tsx` | Fetch setting, add "Recommended" badge on earliest slot, show preference banner |
| `src/utils/autoScheduler.ts` | Boost score for earlier slots when setting enabled |
| `StepBookNext.tsx` | Respect setting in candidate ordering |

