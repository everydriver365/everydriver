

## Remove Border Radius from All Tiles on Instructor Mobile App

This change will remove rounded corners from all card/tile elements across the instructor mobile app and add a left-side accent border (primary color) to maintain visual hierarchy.

### Scope of Changes

The following files contain tiles/cards that need updating:

**1. PupilCardStack.tsx** (Pupil list + expanded profile)
- Collapsed card: already has `rounded-none` + `border-l-primary` (done previously)
- Expanded profile sections: `rounded-2xl` and `rounded-[20px]` on ~10 inner cards (hero, stats, test date, details, notes, lesson history, driving sessions, payments, tools grid, status/admin)
- Tools grid icon backgrounds: `rounded-2xl` on the 14x14 icon containers
- Balance badge: `rounded-lg`
- Payment due warning: `rounded-2xl`

**2. NewMobileScheduleView.tsx** (Schedule lesson cards)
- Lesson cards via `renderCustomCollapsed`: `rounded-[20px]` container
- Empty state card: `rounded-[20px]`
- Add button: `rounded-xl`

**3. ExpandableLessonCard.tsx** (Wrapper for schedule cards)
- Outer container: `rounded-lg`
- Inner card: `rounded-lg`

**4. HomeMoneyOverview.tsx** (Home page money tiles)
- Loading skeleton: `rounded-xl`
- Money cards: `rounded-xl`

**5. HomeTodaySchedule.tsx** (Home page schedule tile)
- Loading skeleton: `rounded-2xl`
- Main card: `rounded-2xl`

**6. AppStyleHomeView.tsx** (Home grid tile icons)
- Icon containers: `rounded-[16px]`
- Icon images: `rounded-[16px]`

**7. InstructorMobileHome.tsx** (Home page hero overview card)
- Today's Overview card: `rounded-2xl`

**8. TodayOverviewStrip.tsx** (Today at a glance strip)
- Strip container: `rounded-xl`

**9. ScheduleDayTabs.tsx** (Day selector pills)
- Day number circles: `rounded-xl`

**10. NextUpTile.tsx** (Next lesson tile on home)
- Info badges: `rounded-xl`
- Action buttons: `rounded-xl`

**11. VerticalTimelineView.tsx** (Timeline lesson cards)
- Lesson cards: `rounded-xl`
- Travel time info: `rounded-lg`

**12. NextLessonCard.tsx** (Swipeable next lesson card)
- Card containers: `rounded-xl`

### What Will Change

For each tile/card element listed above:
- Replace `rounded-xl`, `rounded-2xl`, `rounded-[20px]`, `rounded-[16px]`, `rounded-lg` with `rounded-none`
- Add `border-l-4 border-l-primary` accent where it doesn't already exist (on main container cards only, not on small badges/buttons)

### What Will NOT Change
- Buttons will keep their rounding (action buttons like Call, Email, Navigate) as these are interactive elements, not tiles
- Small badges/pills (lesson type badges, status pills) keep their rounding
- Avatars keep their circular shape
- Sheet/dialog components keep their rounding
- The day selector pills in ScheduleDayTabs keep their shape (these are interactive selectors, not content tiles)

### Technical Details

All changes are CSS class swaps in Tailwind. No logic, state, or functionality changes. Approximately 12 files will be modified with straightforward `rounded-*` to `rounded-none` replacements on card containers, plus adding `border-l-4 border-l-primary` to cards that don't already have it.

