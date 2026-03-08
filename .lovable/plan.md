

## Demo Showcase Page for Pupil & Parent Apps

### Current State
You already have fully-featured pupil and parent portals with everything requested: next lesson countdown, balance/payments, progress tracking, route history, instructor feedback, payment history, in-app messaging, and online payments. These are production-ready at `/p/:slug` (pupil) and `/parent` (parent).

### What to Build
A single **demo showcase page** at `/demo/portals` that renders mock-data versions of both apps side-by-side (or swipeable on mobile), so you can show prospects what their pupils and parents will see — no login required.

### Demo Page Structure

**Route**: `/demo/portals`

**Layout**: Two phone-frame mockups side by side on desktop, tab-switcher on mobile.

Each frame renders a self-contained mini-app with hardcoded mock data:

#### Pupil App Demo Screens (5 swipeable views)
1. **Home** — Next lesson countdown card, quick stats (24 lessons, 72% progress), balance badge (-£45 owed), AI insights card, navigation menu
2. **Payments** — Balance card (£45 owed, red), "Make Payment" CTA, payment history list (5 mock entries), prepaid hours
3. **Progress** — Radar chart of DVSA competencies, syllabus category bars, achievement badges
4. **Messages** — Chat thread with instructor (mock conversation with read receipts)
5. **Route History** — Last lesson route on Leaflet map with speed-coloured segments, lesson stats strip

#### Parent App Demo Screens (3 swipeable views)  
1. **Dashboard** — Child card with stats (lessons/progress/credit), next lesson, test date countdown, recent activity feed
2. **Child Detail** — Expanded view with feedback, upcoming lessons, syllabus overview, payment history, safety scores
3. **Messages** — Message to instructor card

### Technical Approach
- **Single new file**: `src/pages/DemoPortals.tsx`
- **No database calls** — all mock data hardcoded
- **Reuse existing UI components**: `InstructorCard`, `Badge`, `Progress`, `Avatar`
- **Phone frame wrapper**: CSS device frame (rounded corners, notch, home indicator) to give realistic app preview
- **iOS styling**: Matches the existing premium iOS design language (rounded-2xl cards, frosted glass, brand colours)
- **Route**: Add to `App.tsx` as `/demo/portals`

### Mock Data
- Pupil: "Emma Richardson", 24 lessons, 72% progress, -£45 balance, test date 12 Apr 2026
- Instructor: "Mike's Driving School", brand colour #2563EB
- Parent: "Mrs Richardson", viewing Emma's progress
- 5 payment records, 4 chat messages, 6 syllabus categories, 3 route coordinates

This is purely a visual demo — no backend interaction. The screens demonstrate every feature you listed using realistic UK driving lesson data.

