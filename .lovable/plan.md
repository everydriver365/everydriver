

# Redesign Instructor Mobile Home -- Reference-Matched Layout

## What Changes

### 1. Full-Bleed Gradient Hero (ContextualHomeHero)
- Replace the current cropped photo + white overlapping card with a **full-screen hero** that fills the entire viewport height
- The hero image (instructor + pupil in car) sits in the upper portion, blending into a **teal/green-to-dark gradient** that extends to fill the rest of the screen
- The gradient creates a seamless transition from the photo to the stats area below
- **Top bar**: Hamburger menu icon, "EVERY DRIVER UK" text logo, "Free" pill badge, and instructor avatar -- all in white overlaid on the hero
- **Center/lower area**: Large bold white text "13.5h / 30h" with a bright green progress bar underneath and "16.5 hours remaining" subtitle
- **Bottom CTA**: A dark navy outlined button "View offers" with a briefcase icon (only shown when pending job offers exist)
- Remove the current white overlapping card with circular progress ring entirely

### 2. Compact Next Lesson Card
- Positioned just below the hero section as a white rounded card
- Shows pupil avatar, "Next Lesson" label, date, time, pickup postcode, traffic ETA, and payment badge
- Tappable to navigate to the schedule/lesson detail
- Keeps existing data from `useNextLessonDetails`

### 3. iOS-Style 4-Column Icon Grid (QuickActionTiles)
- Replace the current 2-column oblong tile layout (in normal/non-edit view) with a **4-column grid**
- Each tile: square icon container (rounded-2xl, white background, shadow) with label underneath
- Uses existing custom icon images (messages-icon.png, schedule-icon.png, etc.)
- Badge counts for Job Offers and Messages preserved
- Edit mode (drag-and-drop reorder) stays unchanged

### 4. Page Background
- Change from `bg-[#E8F1FE]` to a subtle light grey/white so the tiles and cards stand out cleanly against the gradient hero above

## Technical Details

### Files to Modify

1. **`src/components/instructor/ContextualHomeHero.tsx`**
   - Complete visual redesign: remove white card, remove circular SVG ring
   - Add full-viewport-height container with hero image at top and teal gradient overlay
   - Overlay "EVERY DRIVER UK" top bar with hamburger, Free badge, avatar
   - Large "Xh / Yh" text + progress bar + "X hours remaining" centered in lower portion
   - "View offers" CTA button at the bottom (conditional on pendingJobs > 0)
   - All existing props remain the same (weeklyStats, pendingJobs, currentWeather, etc.)

2. **`src/components/instructor/InstructorMobileHome.tsx`**
   - Remove the "YOUR DAY" section label (next lesson card speaks for itself)
   - Move the compact next lesson card to sit right after the hero
   - Adjust spacing so tiles flow naturally below

3. **`src/components/instructor/QuickActionTiles.tsx`**
   - In the normal (non-edit) view, replace the current layout with a 4-column grid
   - Each tile: `w-16 h-16 rounded-2xl bg-white shadow-sm` icon container + `text-[10px]` label below
   - Badge positioning: top-right corner of the icon square
   - Edit mode layout remains unchanged (list-based drag reorder)

4. **`src/pages/InstructorMobileDemo.tsx`**
   - Update to match the same new layout so the demo page reflects the changes

### Data Sources (Unchanged)
- Weekly hours/goal: `useWeeklyGoals` (hoursThisWeek, hoursGoal, progressPercent)
- Next lesson: `useNextLessonDetails` (pupilName, startTime, minutesUntil, accountBalance, pickupPostcode)
- Quick action tiles: `useInstructorHomepageContent` + `useInstructorTilePreferences`
- Tile badges: `usePendingJobsCount`, `useUnreadMessagesCount`
- Weather: `useDrivingAlerts`
- Traffic ETA: `useTrafficETA`

### Visual Reference Summary
- Hero gradient: blend from transparent over photo into a muted teal/green (`#4a7c6f` to `#2d4a3f` range) filling the lower portion
- Text: bold white, large (text-5xl for hours), with `/` separator in lighter opacity
- Progress bar: bright emerald/green on white/translucent track
- "View offers" button: dark navy background (`bg-[#142542]`), white text, full-width, rounded-xl
- Top bar elements: all white, semi-transparent backgrounds for badges

