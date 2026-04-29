# What's actually on your home page right now

I just re-checked the code and the new calm redesign IS wired into your default mobile home page. Specifically, in `src/components/instructor/InstructorMobileHome.tsx` (line 453), `<CalmHomeHeader />` renders at the very top of the dashboard layout. Your appearance preference in the database is `dashboard`, which is the branch that includes it. So the new block (greeting / compact rings / Up Next tile / 2×2 grid / Tip of the day) is being rendered.

## Why it might *feel* like nothing changed

You earlier chose **"Keep extras below the new layout"**. That means everything that was on the page before is still rendering underneath the new calm header:

- WarmHomeTiles (the "Action Needed" / "1 new job offer" red strip you can see in the session replay)
- MorningBriefingCard
- WeatherAlertBanner
- ActivityTilesGrid (the older 4-tile grid — duplicates the new 2×2)
- PupilMilestoneFeed
- NextUpTile workspace card with the "Tap to expand" map (duplicates the new Up Next tile)
- HomeTodaySchedule, SwipeableQuickAccess, ImpactAlertCard, InsightTilesGrid, TelematicsTile, VehicleHealthCard, IdleTimeCostCard, UpcomingEventsCard

So the calm block is only the top ~600px, and everything you remembered is still scrolling below. From the session replay it looks like you're seeing those older tiles ("ACTION NEEDED · 89 test alerts", "1 new job offer", the map preview) and reading them as "no change happened".

## How I'd recommend resolving this

Pick one. I won't change anything until you say which.

### Option A — Strict redesign (recommended, matches the original spec)

Render **only** the calm layout in the default branch. Removes from this view:

- WarmHomeTiles (red Action Needed strip — duplicated by 2×2 grid)
- MorningBriefingCard
- ActivityTilesGrid (duplicated by 2×2 grid)
- NextUpTile workspace card (duplicated by Up Next tile; map preview goes too)
- HomeTodaySchedule, SwipeableQuickAccess, ImpactAlertCard, InsightTilesGrid, TelematicsTile, VehicleHealthCard, IdleTimeCostCard, UpcomingEventsCard, PupilMilestoneFeed

Kept exactly as-is: AppHeader, urgent-alert overlay, pull-to-refresh, FloatingSessionBar, bottom navigation, FAB, all routing. Every removed feature is still reachable from the new 2×2 grid, the side menu, or other portal screens — nothing is deleted from the app.

### Option B — Light cleanup (keep most extras, remove the obvious duplicates)

Remove only the items the calm block already replaces:

- WarmHomeTiles (red Action Needed strip)
- ActivityTilesGrid (old 4-tile grid)
- NextUpTile workspace card with mini-map

Keep everything else (Morning Briefing, Today schedule, Insights, Telematics, Vehicle Health, etc.). This makes the calm block actually visible and removes the visual duplication, but you keep the longer scroll.

### Option C — Leave as-is

You see the calm block at the top followed by every existing section.

## Files that would change

- `src/components/instructor/InstructorMobileHome.tsx` — remove the relevant JSX from the `else` branch (lines ~456-635). No other files affected. No data hooks deleted (still used by other layouts and screens). No routes change. No bottom navigation change. No notifications/menu changes.

Tell me **A**, **B**, or **C** and I'll apply it.
