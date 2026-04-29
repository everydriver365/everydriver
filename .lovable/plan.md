# Apply the calm home design to the default mobile home

## Why this is needed

The previous redesign was applied to `IOSNativeHomeView.tsx`, which only renders when an instructor's appearance preference is `layoutStyle === "ios-native"`. Your account uses the default `"dashboard"` layout, so you never see it. This plan applies the same calm design to the default branch of `InstructorMobileHome.tsx`, on top of the existing extras.

## What you'll see at the top of the home screen

1. Calm app header — hamburger / DSM brand mark / notifications bell with subtle red dot when unread
2. Personal greeting: "Morning / Afternoon / Evening / Working late, [First name]" + dynamic status line (lessons remaining, done for today, no lessons today, etc.)
3. Compact horizontal progress rings card (80px concentric red/blue/green rings, side legend, "On track today" eyebrow) — taps through to the existing rings/goals view
4. Lightweight Up Next tile — blue clock icon, eyebrow countdown ("Up next · in 1h 20m"), pupil name + duration/time/location, chevron — taps through to the existing diary
5. 2×2 quick-access grid: Job offers (purple), Messages (amber), Test swaps (blue), Fill gaps (green) with category-tinted pills and contextual subtitles
6. Tip of the day card (rotating from a 5-tip pool, soft red/amber gradient, white "Try it" CTA)

Below this new block, **everything currently on the home page stays exactly as it is today** — Morning Briefing, Weather/Driving alerts, the existing ActivityTilesGrid, Pupil Milestone Feed, Next-lesson NextUpTile workspace card, Today schedule, SwipeableQuickAccess, Impact Alerts, Insights, Telematics, Vehicle Health, Idle Time Cost, Upcoming Events, Floating Session Bar.

## Files

### New

- `src/components/instructor/CalmHomeHeader.tsx` — self-contained component that renders the 6 new sections. Reads its own data (next lesson, today overview, weekly goals, jobs/messages/test-swaps/gaps counts, combined notifications), no props besides `instructorId` and `instructorName`. Routes to existing screens: `/instructor/menu`, `/instructor/notifications`, `/instructor/goals`, `/instructor/diary`, `/instructor/jobs`, `/instructor/messages`, `/instructor/test-requests`, `/instructor/gaps`.

### Edited

- `src/components/instructor/InstructorMobileHome.tsx` — in the default `else` branch (currently lines 449-660), replace the existing greeting block (lines 451-478) with `<CalmHomeHeader instructorId={instructorId} instructorName={instructor?.name} />`. Everything else in that branch stays untouched (WarmHomeTiles, MorningBriefingCard, WeatherAlertBanner, ActivityTilesGrid, PupilMilestoneFeed, NextUpTile workspace card, HomeTodaySchedule, SwipeableQuickAccess, ImpactAlertCard, InsightTilesGrid, TelematicsTile, VehicleHealthCard, IdleTimeCostCard, UpcomingEventsCard, FloatingSessionBar).

## Preserved behaviour

- All data hooks, navigation handlers, analytics events, pull-to-refresh, urgent-alert overlay, bottom navigation, FAB
- The existing detailed Up Next workspace card (with mini map, traffic/weather warnings, Start track) — untouched; the new lightweight tile sits above it and routes to `/instructor/diary`
- The existing `ActivityTilesGrid`, Insights, Telematics, etc. — still render below the new block
- The other layout styles (ios-native, schedule, lockscreen, clean, compact, bestmate, mission-control, widgets) — unchanged

## Notes

- Because the default layout has many existing sections, the new calm block will appear at the top and the rest will follow. This matches your "Keep extras below the new layout" choice. If you later want a strict, slimmed-down home, I can hide specific extras in a follow-up.
- Tip of the day uses a hardcoded rotating pool of 5 tips (per earlier choice).
