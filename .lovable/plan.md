
# 20 More iOS-Style Instructor Homepage Designs — Demo Page 3

## Overview

Create a new demo page at `/instructor-ios-demo-3` showcasing 20 fresh iOS-inspired mobile homepage layouts. Uses the same carousel + thumbnail navigation pattern established in the previous demo pages, with all the same mock data and icon assets.

## The 20 New Design Concepts

1. **Spotlight Search** — iOS Spotlight-style search bar at top, recent/suggested actions below, then icon grid
2. **Widget Board** — Three differently-sized iOS widget tiles (small, medium, large) arranged in a masonry layout
3. **Lock Screen** — iOS lock screen aesthetic: time display, inline notifications stack, quick actions at bottom
4. **Focus Mode** — "Driving Focus" banner showing only driving-relevant info (next pupil, route, fuel), simplified grid
5. **App Library** — Auto-categorised icon groups (Teaching, Finance, Vehicle, Admin) with mini 2x2 previews per category
6. **Stacked Notifications** — Grouped notification cards (like iOS Notification Centre) with lesson/payment/message groups
7. **Today View** — iOS Today screen with date header, weather widget, schedule widget, stats widget stacked vertically
8. **Siri Suggestions** — "Suggested for you" section with context-aware shortcuts, followed by full grid
9. **Health Dashboard** — Apple Health-inspired layout: large summary ring, category cards for hours/earnings/pupils
10. **Maps Card** — Apple Maps-style card at top with next pickup preview, ETA pill, and action buttons row
11. **Wallet Pass** — Next lesson styled as an Apple Wallet pass/card with barcode aesthetic, stats below
12. **Journal Entry** — Apple Journal-inspired daily recap card with photo placeholder, stats, and reflections prompt
13. **Action Button Menu** — iOS 17 Action Button radial menu at top for quick actions, content below
14. **Standby Mode** — Landscape-inspired dual-panel: clock + next lesson on one side, stats on the other (portrait adapted)
15. **Photo Memories** — "Memories" style header with gradient text overlay, pupil stats as a photo grid below
16. **Contact Card** — Next pupil displayed as an iOS contact card (large monogram, phone/message buttons), grid below
17. **Live Activities Bar** — Persistent live activity bar at top (next lesson countdown), content below
18. **Shortcuts Automation** — iOS Shortcuts-style cards showing automated workflows (log hours, send reminders), then grid
19. **Screen Time** — Screen Time-inspired bar chart for daily teaching hours, category breakdown, then grid
20. **Apple Music Now Playing** — Music player-inspired layout: large "album art" (pupil avatar), progress bar (lesson progress), controls row

## Technical Details

### New file: `src/pages/InstructorIOSDemo3.tsx`

- Follows exact same structure as `InstructorIOSDemo2.tsx`: carousel with arrow navigation, thumbnail gallery, phone frame
- Reuses same mock data object, icon imports, helper components (Card, Row, SectionLabel, IconGrid, Ring, StatPill)
- Same iOS colour constants (BG #f2f2f7, CARD #ffffff, system blue/green/orange/red/purple/teal/indigo/pink)
- Each design is a self-contained component (`Design1` through `Design20`)
- Uses framer-motion for transitions between variants

### Route addition in `src/App.tsx`

- Add lazy import and route: `/instructor-ios-demo-3`

### No database or backend changes

Purely a frontend demo page.
