

# Pupil Portal UX Improvements

After auditing the `BrandedPupilPortal.tsx` (777 lines, 18 sections) and all 64 pupil components, here are the gaps compared to apps like Drivebook, DriveReady, and modern mobile-first patterns.

---

## Issues Found

### 1. Home page is overloaded — 15+ components stacked vertically
The home section renders SlotOfferNotification, CheckIn, PushBanner, EndOfLessonWizard, PostLessonRating, LessonSummary, LessonPrep, LessonCountdown, WidgetGrid, JourneyTimeline, Goals, LessonStreak, AchievementBadges, WhatsNewModal, DashboardInsights, then a 16-item navigation list, ReferralCard, and Contact. This is overwhelming on mobile. Competitors group content into 2-3 clear "zones" with collapsible sections.

**Fix:** Group the home dashboard into 3 visual zones:
- **Zone 1 — "Right Now"**: Countdown, CheckIn, EnRoute, SlotOffer (contextual, only shows when relevant)
- **Zone 2 — "Your Stats"**: WidgetGrid, Streak, Badges (collapsible)
- **Zone 3 — "Quick Access"**: Navigation menu (already exists)

Move Goals, JourneyTimeline, and AI Insights into their own bottom-nav-accessible sections rather than cramming them on home.

### 2. Navigation menu has 16 items — too many for mobile
The iOS-style list on the home page has 16 items (Profile, Lessons, Book, Messages, Notes, Reflections, Payments, Theory, Show/Tell, AI Coaching, Progress, Lesson Tracks, Lesson Videos, Driving Style, Test Swap, History). This is more than most app stores allow in a settings page. Many items are rarely used.

**Fix:** Group into 4 categories with collapsible headers:
- **Learning**: Lessons, Book, Progress, Theory, Show/Tell
- **My Data**: Lesson Tracks, Lesson Videos, Driving Style, History
- **Account**: Profile, Payments, Messages, Notes
- **Tools**: AI Coaching, Test Swap, Reflections

### 3. No search/filter on the navigation menu
With 16 items, there's no way to quickly find a specific section. Competitors with 10+ menu items add a search filter at the top.

**Fix:** Add a small search input above the navigation list that filters items as you type.

### 4. Every sub-page has an identical, unstyled "← Back" button
All 15+ sub-pages render the same raw `<button>← Back</button>` with identical styling. This should be a shared component with better visual presence.

**Fix:** Create a reusable `SubPageHeader` component with the section title, a proper back arrow icon, and optional action buttons. Apply across all sub-pages to eliminate the 15 duplicated back-button blocks.

### 5. No "Test Countdown" widget
Pupils with a booked practical test have no countdown timer on the dashboard. Competitors (DriveReady, Drivebook) prominently show "X days until your test" with a progress ring. The data exists in the journey timeline but isn't surfaced as a widget.

**Fix:** Add a `TestCountdownCard` that queries `pupil_tests` or the test date field, showing days remaining with an animated ring. Place in Zone 1 on the home dashboard.

### 6. No quick-action FAB (Floating Action Button)
On mobile, common actions like "Book a Lesson", "Make Payment", or "Message Instructor" require navigating to a sub-page first. Competitors use a FAB or speed-dial for the top 3 actions.

**Fix:** Add a floating action button (bottom-right, above the nav bar) that expands into 3 quick actions: Book Lesson, Pay Now, Message. Collapse when scrolling down.

### 7. Payment balance not visible from bottom nav
The bottom nav shows Home, Lessons, Payments, Theory, Messages — but there's no visual indicator of outstanding balance. Pupils with debt should see a red badge on the Payments tab.

**Fix:** Pass `account_balance` to `PupilBottomNav` and show a red dot/badge on the Payments icon when balance is negative.

---

## Implementation Plan

### 1. Group home dashboard into 3 zones
- Wrap contextual cards (Countdown, CheckIn, SlotOffer) in a "Right Now" section
- Wrap stats (WidgetGrid, Streak, Badges) in a collapsible "Your Progress" section
- Keep navigation list as "Quick Access" zone
- Move Goals, Timeline, AI Insights out of home into their own nav targets

### 2. Group navigation menu into 4 collapsible categories
- Replace flat 16-item list with 4 accordion groups (Learning, My Data, Account, Tools)
- Add a filter/search input above the groups

### 3. Create reusable `SubPageHeader` component
- Props: title, onBack, optional action slot
- Replace all 15 inline back-button blocks in BrandedPupilPortal.tsx

### 4. Add `TestCountdownCard` component
- Query test date from database
- Show days remaining with animated progress ring
- Render in Zone 1 when a test is booked

### 5. Add floating quick-action button
- 3 actions: Book, Pay, Message
- Auto-hide on scroll down, show on scroll up
- Position above bottom nav with safe spacing

### 6. Add payment balance badge to bottom nav
- Pass balance to PupilBottomNav, show red indicator when negative

### Files to modify
- `src/pages/BrandedPupilPortal.tsx` — restructure home zones, grouped nav, replace back buttons
- `src/components/pupil-portal/PupilBottomNav.tsx` — add balance badge support
- **New**: `src/components/pupil-portal/SubPageHeader.tsx`
- **New**: `src/components/pupil-portal/TestCountdownCard.tsx`
- **New**: `src/components/pupil-portal/PupilQuickActions.tsx` (FAB)
- **New**: `src/components/pupil-portal/GroupedNavMenu.tsx` (accordion nav)

