

## Design Consistency Audit

After reviewing the homepage (`AppStyleHomeView`, `SwipeableQuickAccess`) and several sub-pages (`InstructorSchedule`, `InstructorPupils`, `InstructorTodos`, `InstructorJobs`, `InstructorExpenses`, `InstructorSettings`), here are the inconsistencies:

### Current Problems

| Element | Homepage Style | Sub-page Style |
|---|---|---|
| **Cards** | `#F2F3F5` bg, 20px radius, multi-layer shadow | Default `<Card>` with `rounded-xl`, thin border, minimal shadow |
| **Icon containers** | 44px circles, `#E6E8EC` bg, custom PNGs | 32px `rounded-lg`, varied color backgrounds (`bg-purple-100`, `bg-amber-100`, etc.) |
| **Page headers** | N/A (tiles) | Inconsistent — some have icon badges, some plain text |
| **Shadows** | `0px 8px 20px rgba(0,0,0,0.08)` + inset highlight | `shadow-sm` or none |
| **Interaction** | `scale(0.98)` spring tap | Default or no tap feedback |

### Plan

#### 1. Create shared `InstructorPageHeader` component
A reusable header matching the homepage visual language: 44px rounded icon container with `#E6E8EC` background, consistent title/subtitle typography, and optional action button.

**File:** `src/components/instructor/InstructorPageHeader.tsx` (new)

#### 2. Create `InstructorCard` wrapper component
A styled card matching homepage aesthetics: `#F2F3F5` background (dark: `#1C1C1E`), `rounded-[20px]`, multi-layer shadow, inset highlight, optional tap animation.

**File:** `src/components/instructor/InstructorCard.tsx` (new)

#### 3. Update key sub-pages to use new components
Apply the new `InstructorPageHeader` and `InstructorCard` to these high-traffic pages:

- `InstructorSchedule.tsx` — header + card wrappers
- `InstructorPupils.tsx` — header + hero card + list cards
- `InstructorTodos.tsx` — header + task cards
- `InstructorJobs.tsx` — header + job cards
- `InstructorExpenses.tsx` — header
- `InstructorSettings.tsx` — header + settings tile cards
- `InstructorMessages.tsx` — header (inbox component internal)

#### 4. Standardize icon container styling
Replace per-page colored icon backgrounds (`bg-violet-100`, `bg-purple-100`, etc.) with the homepage's uniform `#E6E8EC` circle style, using the custom PNG icons where available (from the asset map) and Lucide fallbacks otherwise.

### Scope
- **8 files changed** (2 new components + 6 page updates)
- No functional changes — purely visual consistency
- Dark mode support maintained via semantic tokens

