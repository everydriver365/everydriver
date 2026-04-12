

## Plan: "Every Instructor" Mobile Portal — LBC-Style Design

### What We're Building
A new mobile portal at `/every-instructor/*` that mirrors all current instructor portal functionality but restyled to match the LBC app design: bold hero image at top, horizontally scrollable card sections with section headers ("More" links), and a clean bottom tab bar with icons and labels.

### Design Reference (from LBC screenshot)
- **Header**: Minimal top bar with title text + utility icons (search, settings, analytics)
- **Hero**: Full-width, tall featured image/card with overlaid text
- **Content sections**: Bold section titles with "More" link, horizontally scrollable card rows
- **Cards**: Rounded corners, image-heavy with text labels below
- **Bottom nav**: 5 tabs with icons + labels, highlighted active tab in blue
- **Background**: Pure white, clean and minimal

### Implementation Approach

**1. Create the Every Instructor layout component**
`src/components/layout/EveryInstructorLayout.tsx`
- White background, minimal header with "Every Instructor" title + search/settings/notifications icons
- Bottom nav with 5 tabs: Home, Schedule, Track, Money, More (matching current nav items)
- Wraps child pages identical to `InstructorPortalLayout` but with the new styling

**2. Create the Every Instructor home page**
`src/pages/EveryInstructorHome.tsx`
- **Hero section**: Full-width image card (instructor's hero image or default) with overlaid greeting text and diagonal accent banner (like LBC's "EXCLUSIVE EPISODES" banner)
- **Scrollable sections** with bold titles + "More" links:
  - "Today's Schedule" — horizontal scroll of lesson cards (pupil photo, name, time)
  - "Quick Actions" — horizontal scroll of action tiles (Job Offers, Messages, Tests, Fill Gaps)
  - "Your Business" — horizontal scroll of stat cards (Revenue, Expenses, Pupils)
  - "Insights" — horizontal scroll of insight cards (Streak, Weekly Goals, Tomorrow Preview)
  - "Vehicle & Tracking" — telematics and GPS cards
- Each card: rounded-xl, image or icon at top, label + subtitle below
- Uses all existing hooks (useTodayOverview, useNextLessonDetails, etc.)

**3. Create route configuration**
`src/routes/everyInstructorRoutes.tsx`
- `/every-instructor` → Home
- All sub-routes (`/every-instructor/schedule`, `/every-instructor/pupils`, etc.) reuse existing page components but wrapped in the new layout

**4. Bottom Navigation**
`src/components/instructor/EveryInstructorBottomNav.tsx`
- 5 tabs: News-style icons matching LBC (Home, Schedule, Track, Money, More)
- Active tab highlighted in brand blue with filled icon
- Clean white background with subtle top border

### Files to Create/Edit
| File | Action |
|---|---|
| `src/components/layout/EveryInstructorLayout.tsx` | Create — new layout shell |
| `src/components/instructor/EveryInstructorBottomNav.tsx` | Create — LBC-style bottom nav |
| `src/pages/EveryInstructorHome.tsx` | Create — LBC-style homepage |
| `src/routes/everyInstructorRoutes.tsx` | Create — route definitions |
| `src/App.tsx` | Edit — add route import |

### Key Styling Details
- Background: `#FFFFFF` (pure white like LBC)
- Section headers: Bold, large text (text-2xl font-bold) with blue "More" link
- Cards: `rounded-2xl`, subtle shadow, image-first design
- Hero: Aspect ratio ~16:9, full-bleed, diagonal accent banner
- Bottom nav: White bg, active = blue icon + label, inactive = gray
- Horizontal scrolling: `overflow-x-auto flex gap-4 snap-x` with peek of next card
- All existing data hooks, auth context, and business logic reused as-is

