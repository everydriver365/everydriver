

## Redesign Pupil & Parent Portals to Match Instructor Mobile Design

### Current State
- **Pupil Portal** (`PupilPortal.tsx`): Uses `MainLayout` (learner site header/footer), standard `Card` components, desktop-oriented grid layout
- **Branded Pupil Portal** (`BrandedPupilPortal.tsx`): Custom branded header with inline CSS vars, basic bottom nav, `Card`-based navigation menu, closer to mobile but doesn't use instructor design components
- **Parent Portal** (`ParentPortal.tsx`): Uses `MainLayout`, desktop `Card` layout, phone/OTP auth screens with standard cards, no bottom nav on mobile

### Target Design (Instructor Mobile Pattern)
- `InstructorMobileHeader` — sticky primary-colored header with avatar, decorative circles, action buttons
- `InstructorBottomNav` — 6-tab bottom nav with wallpaper-aware contrast colors, badges
- `InstructorCard` — #F2F3F5 bg, 20px radius, multi-layer shadows, inset ring highlight
- `InstructorPageHeader` — 44px icon circle + title/subtitle
- Wallpaper background color (default #E8F1FE)
- No `MainLayout` wrapper (no learner header/footer)

### Plan

**1. Create shared portal layout components**

- **`PupilMobileHeader`** — Mirrors `InstructorMobileHeader` structure: sticky primary header with pupil avatar/name, back button support, brand color support. Shows instructor name as subtitle. Action buttons: notifications bell, dark mode toggle, logout via settings dropdown.
- **`PupilBottomNav`** — Mirrors `InstructorBottomNav`: 5-6 tabs (Home, Lessons, Payments, Theory, More). Uses wallpaper-aware contrast colors. Active tab indicator.
- **`ParentMobileHeader`** — Same pattern for parent: avatar with parent initials, child selector dropdown in header.
- **`ParentBottomNav`** — Tabs: Home, Children, Messages, Settings.

**2. Refactor `BrandedPupilPortal.tsx`**

- Replace custom header with `PupilMobileHeader`
- Replace inline `Card`-based nav menu with `InstructorCard`-styled tiles (grid of icon tiles like `AppStyleHomeView`)
- Replace bottom nav with `PupilBottomNav`
- Use wallpaper background color instead of CSS variable approach
- Use `InstructorCard` for all content cards (stats, lesson countdown, etc.)
- Use `InstructorPageHeader` for sub-page headers
- Remove `MainLayout` wrapper entirely

**3. Refactor `PupilPortal.tsx`**

- Remove `MainLayout` wrapper
- Add `PupilMobileHeader` and `PupilBottomNav`
- Replace standard `Card` components with `InstructorCard`
- Apply wallpaper background
- Use `InstructorPageHeader` for section headers
- Convert stats grid to use the same rounded card styling

**4. Refactor `ParentPortal.tsx`**

- Remove `MainLayout` wrapper from all auth states and dashboard
- Add `ParentMobileHeader` and `ParentBottomNav`
- Convert auth screens (phone entry, OTP) to use `InstructorCard` styling with wallpaper background
- Convert child cards and detail view to use `InstructorCard`
- Convert stats, feedback, progress sections to matching tile style
- Use `InstructorPageHeader` for section titles

**5. Update sub-components styling**

- Ensure `PupilPortalLessonCountdown`, `PupilPortalSchedule`, `PupilPortalPayments`, etc. use `InstructorCard` instead of standard `Card` where appropriate
- Update `ParentMessageCard`, `ParentSyllabusOverview`, `ParentPaymentHistory`, `ParentUpcomingLessons`, `ParentSafetyScores` to use `InstructorCard`

### Files to Create
- `src/components/pupil-portal/PupilMobileHeader.tsx`
- `src/components/pupil-portal/PupilBottomNav.tsx`
- `src/components/parent/ParentMobileHeader.tsx`
- `src/components/parent/ParentBottomNav.tsx`

### Files to Modify
- `src/pages/BrandedPupilPortal.tsx` — Full layout refactor
- `src/pages/PupilPortal.tsx` — Full layout refactor
- `src/pages/ParentPortal.tsx` — Full layout refactor
- Various pupil-portal and parent sub-components for card styling updates

### No Database Changes

