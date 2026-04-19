
**Goal:** Apply the DSM logo's tri-color palette (Red, Blue, Charcoal) consistently across the instructor portal.

**Logo colors extracted:**
- Red `#E63329` (D block)
- Blue `#1F86FF` (S block) 
- Charcoal `#1C1C1E` (M block)

**Changes:**

1. **Header gradient** (`MobileBlueHeader.tsx`)
   - Refresh `HEADER_GRADIENT` to vibrant logo blue: `linear-gradient(145deg, #0066E0 0%, #1F86FF 50%, #4DA6FF 100%)`
   - Safe area + sticky background updated together

2. **Dashboard activity tiles** (Job Offers, Messages, Tests, Fill Gaps)
   - Job Offers → Red `#E63329` gradient (urgent / needs action)
   - Tests → Charcoal `#1C1C1E` gradient (high-stakes premium)
   - Messages → Blue `#1F86FF` gradient
   - Fill Gaps → soft blue tint (neutral)

3. **Global accent swap (instructor scope only)**
   - Primary buttons, active tab indicator, focus rings, link color → logo Blue `#1F86FF`
   - Destructive badges (notification dot, SOS) → logo Red `#E63329`
   - Primary headings → Charcoal `#1C1C1E`
   - Update CSS tokens in `src/index.css` where instructor portal consumes them

**Out of scope:**
- Pupil-facing Drive365 routes keep their own brand
- No layout, spacing, or functional changes
- Mobile homepage layout not restructured (per project rule)

**Files to touch:**
- `src/components/instructor/MobileBlueHeader.tsx`
- `src/components/instructor/HomepageHero.tsx`
- Activity tile components (Job Offers / Messages / Tests / Fill Gaps)
- `src/index.css` (instructor-scoped tokens)
- `mem://style/instructor-activity-tile-icons` updated to record new mapping
