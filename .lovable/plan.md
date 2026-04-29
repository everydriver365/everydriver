# Restore the rest of the instructor home page

## What happened

During the earlier "Strict redesign / calm" cleanup of `src/components/instructor/InstructorMobileHome.tsx`, the default layout branch was reduced to just three things:

1. `<CalmHomeHeader />` (greeting + merged Today stats + Up Next)
2. `<WeatherAlertBanner />`
3. `<DrivingAlertsStrip />` + `<FloatingSessionBar />`

Everything else that used to render below the header — today's schedule list, quick action tiles, activity tiles, telematics, vehicle health, plan/referral widgets, pupil milestones, tomorrow peek, road alerts, bottom promo, etc. — was removed from the JSX (the imports were left in place, which is why they look "available" but nothing shows on screen).

The other layout styles (`schedule`, `lockscreen`, `clean`, `ios-native`, `compact`, `bestmate`, `mission-control`, `widgets`) were not touched and still render their own full content. Only the **default ("calm") layout** lost its sections.

## Goal

Keep the new `CalmHomeHeader` (which already merges Today stats + Up Next + rings + goals) at the top, and restore the rest of the home page underneath it in a sensible order, without re-introducing duplication of what `CalmHomeHeader` already shows.

## Proposed order for the default layout

```text
CalmHomeHeader                  (greeting, rings, Up Next, goals)  — kept
WeatherAlertBanner              (weather + traffic to next pupil)  — kept
DrivingAlertsStrip              (non-weather alerts)               — kept
────────────────────────────────────────────────────────────
RoadAlertsRow                   (road closures / incidents row)
HomeTodaySchedule               (today's remaining lessons list)
TomorrowPeekCard                (tomorrow at a glance)
QuickActionTiles                (search + primary actions)
ActivityTilesGrid               (editable 2x N tiles, edit-mode aware)
TestRequestsTile                (test requests summary)
TelematicsTile                  (driving/telematics summary)
VehicleHealthCard               (engine faults, MOT, service)
IdleTimeCostCard                (idle cost insight)
SmartRemindersCard              (reminders)
PupilMilestoneFeed              (recent pupil wins)
UpcomingEventsCard              (upcoming tests / events)
PlanWidget + ReferralStatsWidget (subscription + referrals)
BottomPromoGroup                (promos / cross-sell)
FloatingSessionBar              (only when a lesson is in progress) — kept
```

Each section is wrapped in `px-4` with consistent vertical spacing (`mt-3` / `mt-4`) to match the existing rhythm used elsewhere in the file.

## Anti-duplication rules

- Do **not** re-add `WarmHomeTiles`, `ContextualHomeHero`, `HomepageHero`, `MorningBriefingCard`, `ReadyToTeachTile`, `WeeklyGoalRing`, or `NextUpTile` — these overlap with what `CalmHomeHeader` now shows (greeting, rings, goals, Up Next). They stay out.
- Do **not** re-add `TodayMiniTimeline` — `HomeTodaySchedule` covers the same ground more usefully.
- Keep `FloatingSessionBar` exactly where it is (last child of the fragment).

## Files to change

- `src/components/instructor/InstructorMobileHome.tsx` — only the default-layout `<>...</>` branch (lines ~451–486). All the required components are already imported at the top of the file, so no new imports are needed; the unused-import warnings will also clear up once they're rendered again.

No other files, no DB changes, no new components.

## Out of scope

- The other layout styles (schedule / lockscreen / clean / ios-native / compact / bestmate / mission-control / widgets) — untouched.
- The mobile layout structure itself — per project memory, mobile changes are not made unless explicitly instructed; this is purely restoring sections the user previously had on this same mobile home view.
- `CalmHomeHeader` internals — left as-is.

## After approval

I'll edit the default branch in `InstructorMobileHome.tsx` to render the sections listed above in that order, then you can confirm on `/instructor` that the home page feels complete again. If any specific section shouldn't come back (e.g. you don't want PlanWidget or BottomPromoGroup), tell me which and I'll omit them.
