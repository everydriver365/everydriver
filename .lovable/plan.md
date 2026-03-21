

## Audit: Unwired / Non-Live Data & UI Improvement Suggestions

### 1. Items Not Showing Live Data

| Area | Issue | Location |
|------|-------|----------|
| **Driver Score = hardcoded 87** | `FleetDashboard.tsx` line 122: `const driverScore = 87;` with comment "Simulated driver score (would come from real data)". This score ring on the telematics Overview is completely static. | `src/components/instructor/FleetDashboard.tsx` |
| **Speeding Events = "—"** | `FleetDashboard.tsx` line 132: Safety section shows `"—"` for speeding events with "View speeding tab" — never queries `telematics_alerts` for a real count. | `src/components/instructor/FleetDashboard.tsx` |
| **Google Calendar "coming soon"** | `MobileScheduleView.tsx` line 534: Calendar integration shows a static "coming soon" message when the user tries to interact with it. | `src/components/instructor/MobileScheduleView.tsx` |

### 2. Fixes to Wire Up

#### A. Replace hardcoded Driver Score with live data
- Query `geotab_driver_events` (or `telematics_alerts`) for the selected period
- Calculate a real 0–100 score based on event count and severity (same formula used in `GeotabDriverBehaviourTab`)
- Fall back to "—" if no data rather than showing a fake 87

#### B. Wire up Speeding Events count
- Query `telematics_alerts` where `alert_type = 'speeding'` for the instructor and selected period
- Show the actual count instead of "—"

#### C. Remove or update "coming soon" placeholder
- Either wire up the existing Nylas calendar integration or change the message to explain the current sync status

### 3. UI Improvement Suggestions

| Suggestion | Detail |
|------------|--------|
| **Animated score ring** | The driver score ring should animate on load (stroke-dashoffset transition) and change colour (green → amber → red) based on actual score thresholds |
| **Tappable safety row items** | The "Speeding Events" and "Driver Score" rows have a chevron but don't navigate anywhere — link them to the relevant Geotab tabs |
| **Payment "This Month" card** | Add a sparkline mini-chart inside the gradient card showing daily earnings trend (data already available from `useDailyEarnings`) |
| **Vehicle status refresh indicator** | Show a "Last updated X min ago" timestamp on the live vehicle strip so instructors know the data is fresh |
| **Empty state for new instructors** | The telematics Overview shows blank sections with no guidance — add an onboarding prompt ("Connect a tracker to get started") when no devices exist |
| **Mileage chart period label** | When period is "Today" and there's only one bar, the chart looks sparse — switch to an hourly breakdown for the "Today" view |

### 4. Implementation Steps

1. **Wire driver score**: Query alerts/events in `FleetDashboard.tsx`, compute score, replace `const driverScore = 87`
2. **Wire speeding count**: Add a query for speeding alerts in the same component, display real count
3. **Make safety rows tappable**: Wrap each row with `onClick` to switch to the relevant tab (speeding, behaviour)
4. **Add "last seen" timestamp**: Show relative time on the vehicle status strip using `formatDistanceToNow`
5. **Add empty state**: Show a setup CTA when `devices.length === 0` instead of blank sections

No database changes needed — all data already exists in existing tables.

