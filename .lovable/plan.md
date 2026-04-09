

## Redesign: Instructor Mobile Homepage — David Lloyd Style

### Reference Analysis
The David Lloyd app uses:
- Full-width hero image at top (no overlay text, clean)
- A motivation/progress card overlapping the hero bottom (milestone tracker with circular progress)
- Full-width action tile ("View Timetable")
- 2x2 grid of action tiles with icons and labels
- Horizontal scrollable promo banner cards at the bottom
- Clean white background, generous spacing, minimal UI

### Mapping Current Features to New Layout

```text
┌─────────────────────────────┐
│  HERO IMAGE (full-width)    │  ← HomepageHero image, no text overlay
│                             │
├─────────────────────────────┤
│  MOTIVATION CARD            │  ← "ON YOUR MARKS..." style card with
│  [Title + subtitle]   0/6  │    progress ring (today lessons progress)
│                      DAYS   │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ 📅 View Schedule      │  │  ← Full-width tile (like "View Timetable")
│  └───────────────────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │ Job      │ │ Messages │  │  ← 2x2 grid from ActivityTilesGrid
│  │ Offers   │ │          │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │ Test     │ │ Fill     │  │
│  │ Requests │ │ Gaps     │  │
│  └──────────┘ └──────────┘  │
├─────────────────────────────┤
│  NEXT LESSON CARD           │  ← NextUpTile (retained)
├─────────────────────────────┤
│  TODAY'S SCHEDULE           │  ← TodayScheduleAgenda (retained)
├─────────────────────────────┤
│  QUICK ACCESS (swipeable)   │  ← SwipeableQuickAccess (retained)
├─────────────────────────────┤
│  PROMO BANNERS (scroll)     │  ← Horizontal scroll cards from CMS
├─────────────────────────────┤
│  Insights + Vehicle + etc   │  ← All remaining sections retained
└─────────────────────────────┘
```

### Implementation Plan

**File to modify:** `src/components/instructor/InstructorMobileHome.tsx` — the default `dashboard` layout branch (lines 415–579).

#### Step 1: Redesign the Hero Section
- Replace `HomepageHero` with a clean full-width hero image (no text overlay, no progress rings on top)
- Image fills ~40% of viewport height with rounded bottom corners
- Instructor name/greeting shown below or overlapping as a card

#### Step 2: Add Motivation/Progress Card
- Create an overlapping card (negative margin into hero) styled like David Lloyd's "ON YOUR MARKS" card
- Left side: motivation title + subtitle from CMS (`content.motivation_title`, `content.motivation_subtitle`)
- Right side: circular progress ring showing today's lesson progress (completed/total)
- Clean white card with subtle shadow

#### Step 3: Redesign Activity Tiles
- Replace current `ActivityTilesGrid` layout with David Lloyd style:
  - One full-width tile at top (Next Lesson or Schedule link)
  - 2x2 grid below with rounded cards, left-aligned colored icons, bold labels
  - White cards with subtle border, clean typography

#### Step 4: Retain All Remaining Sections
- Keep all existing sections below (MorningBriefing, DrivingAlerts, NextUpTile, TodayScheduleAgenda, SwipeableQuickAccess, Insights, VehicleHealth, etc.) with only minor spacing adjustments for visual consistency

#### Step 5: Add Horizontal Promo Banners
- Style the existing CMS promo banners as horizontal scrollable cards (like David Lloyd's "Guest Pass" section) positioned after Quick Access

### Technical Details
- Only the default `dashboard` layout branch in `InstructorMobileHome.tsx` is modified
- No changes to other layout variants (iOS Native, Mission Control, etc.)
- No mobile-specific layout files are touched per the existing constraint
- All existing hooks, data, and features remain connected
- New styling uses Tailwind utilities and existing design tokens

