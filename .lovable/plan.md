
# 20 No-Hero Mobile Homepage Designs — Demo Page

## Overview

Create a new demo page at `/instructor-nohero-demo` that showcases 20 different mobile instructor homepage layouts, all without a hero image. Each design is rendered in a phone-sized preview frame so you can scroll through and compare them side by side.

## Data Used

Each design variant will use the same mock data already established in `InstructorMobileDemo.tsx`:
- Next lesson details (pupil name, time, postcode, ETA)
- Today's stats (lessons, hours, earnings)
- Weekly progress (hours vs goal, progress bar)
- Quick action icon grid (4-column, using existing custom icon images)
- Badge counts (messages, jobs)

## The 20 Design Concepts

1. **Stats Bar + Grid** — Three stat pills at top (lessons / hours / earnings), then straight into 4-col icon grid
2. **Greeting Card** — "Good morning, Kenneth" card with today's date, inline stats row, then grid below
3. **Progress Ring** — Large circular progress ring (weekly hours) centered at top, stats below, then grid
4. **Next Lesson Hero** — Next lesson card is the hero (full-width, prominent pupil avatar, time, location), grid below
5. **Compact Dashboard** — Two-row stat cards (2x2 grid: lessons, hours, earnings, weekly %), then icon grid
6. **Timeline Strip** — Vertical timeline of today's lessons at top (compact), then icon grid
7. **Gradient Banner** — Coloured gradient strip with greeting + weekly summary text, no image, grid below
8. **Earnings Focus** — Big earnings number centred ("£240 today"), small supporting stats, then grid
9. **Map Peek** — Small inline map snippet (static placeholder) showing next pickup location, then grid
10. **Minimal Clean** — Just the greeting, a thin progress bar, and the icon grid — nothing else
11. **Card Stack** — Stacked cards: Next Lesson card, Weekly Progress card, then grid
12. **Split Stats** — Left half: big hour count, right half: big earnings count, full-width progress bar, grid
13. **Tabbed Sections** — Tabs at top (Today / Week / Month) with stats switching, grid always visible below
14. **Weather + Stats** — Weather condition banner (icon + temp + driving tip), stats row, grid
15. **Agenda List** — Today's lessons as a compact list (time + name), then grid
16. **Gamified** — XP-style progress bar, streak counter, achievement badges, then grid
17. **Pill Navigation** — Horizontally scrollable pill buttons (Today, Pupils, Money, etc.) at top, grid below
18. **Quote + Stats** — Motivational quote banner, then stats strip, then grid
19. **Big Avatar** — Large instructor profile circle at top with name + greeting, stats row, grid
20. **Notification Centre** — Stacked notification cards (unread messages, pending jobs, upcoming lesson), then grid

## Technical Details

### New file: `src/pages/InstructorNoHeroDemo.tsx`

- Single page component rendering 20 phone mockup frames in a responsive grid (2-3 columns on desktop, 1 on mobile)
- Each frame is a `div` with `w-[375px] h-[700px] overflow-y-auto rounded-3xl border shadow` to simulate a phone screen
- All designs use mock data (no live queries needed for the demo)
- Reuses existing icon image imports and the `customIconImages` mapping
- Each variant is a small self-contained component (e.g. `DesignVariant1`, `DesignVariant2`, etc.) within the file
- Uses Tailwind for all styling, framer-motion for subtle animations

### Route addition in `src/App.tsx`

- Import the new page and add route: `/instructor-nohero-demo`

### No database or backend changes required

This is purely a frontend demo page for visual comparison.
