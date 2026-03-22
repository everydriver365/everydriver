

## Plan: PDI Free Programme with Auto-Conversion

### Concept
When an instructor selects "Trainee" (PDI) during onboarding, they automatically get a special **PDI Free** experience:
- Skip the plan selection + payment steps entirely
- Get the Free plan with a `pdi_programme` flag on their subscription
- See a dedicated PDI dashboard banner explaining their free access and what happens when they qualify
- When they later update their ADI grade to A or B (via profile settings), the system detects the change and prompts them to choose a paid plan

### Database Changes

**1. Add `is_pdi_programme` column to `instructor_subscriptions`**
```sql
ALTER TABLE instructor_subscriptions ADD COLUMN is_pdi_programme boolean DEFAULT false;
```

**2. Add `qualification_converted_at` column**
```sql
ALTER TABLE instructor_subscriptions ADD COLUMN qualification_converted_at timestamptz;
```

### Onboarding Flow Changes

**`InstructorOnboarding.tsx`** — When `adi_grade === "Trainee"`:
- After StepQualifications, skip steps 7 (Plan Selection) and 9 (Payment)
- Auto-assign the Free plan with `is_pdi_programme = true`
- Still show StepServices, StepWebsite, StepDomainHosting (free options only)

**`StepQualifications.tsx`** — Add a callout below the Trainee option:
> "As a PDI, you get full access to our diary and management tools for free. When you qualify as an ADI, you'll be invited to choose a plan."

### Auto-Conversion Trigger

**`InstructorDetailsEditor.tsx`** — When ADI grade is changed from "trainee" to "A" or "B":
- Check if `is_pdi_programme === true` on their subscription
- Show a congratulations modal: "You've qualified! Choose a plan to unlock premium features"
- Link to `/instructor/plans`
- Update `qualification_converted_at` timestamp
- Set `is_pdi_programme = false`

### PDI Dashboard Banner

**New: `src/components/instructor/PDIBanner.tsx`** — A dismissible banner shown on the dashboard for PDI programme instructors:
- "You're on the PDI Free Programme. All core tools are yours while you train. When you qualify, upgrade to unlock premium features like GPS tracking and dashcam."
- Shows on the main dashboard layout when `is_pdi_programme === true`

### Comparison Matrix

**Insert a new row** into `comparison_features`:
- Feature: "PDI Free Programme" in category "Core"
- ✓ for Free plan, ✓ for all paid plans

### Files Changed

| File | Change |
|------|--------|
| Database migration | Add `is_pdi_programme` + `qualification_converted_at` to `instructor_subscriptions` |
| `src/pages/instructor-app/onboarding/InstructorOnboarding.tsx` | Skip plan/payment steps for trainees, auto-assign free plan with PDI flag |
| `src/pages/instructor-app/onboarding/steps/StepQualifications.tsx` | Add PDI free programme callout |
| `src/components/instructor/InstructorDetailsEditor.tsx` | Detect grade change from trainee → A/B, trigger conversion flow |
| `src/components/instructor/PDIBanner.tsx` | **New** — dashboard banner for PDI users |
| `src/components/instructor/InstructorDashboard.tsx` (or layout) | Show PDI banner when applicable |
| Database insert | Add "PDI Free Programme" to `comparison_features` |

